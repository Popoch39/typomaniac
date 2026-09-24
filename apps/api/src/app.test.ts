import { describe, expect, test } from "bun:test";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import type { OAuth2Tokens } from "better-auth/oauth2";
import type { DiscordProfile, GithubProfile, GoogleProfile } from "better-auth/social-providers";
import { status, t } from "elysia";
import pino from "pino";
import { defaultPace } from "typing-engine";

import { createApp } from "./app";
import { ApiError } from "./lib/errors";
import { DOCS_PATH, SPEC_PATH } from "./plugins/api-docs";
import { MAX_REQUEST_BODY_SIZE } from "./plugins/body-limit";
import { CLIENT_IP_HEADER } from "./plugins/client-ip";
import {
  createTestAuth,
  FRONT_ORIGIN,
  memoryDuelStore,
  pastDuel,
  signIn as signInAs,
  testAuthOptions,
  testConfig,
} from "./test-app";

const app = createApp(testConfig());

describe("app", () => {
  test("GET /api/health answers ok", async () => {
    const response = await app.handle(new Request("http://localhost/api/health"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  test("serves nothing outside the /api prefix", async () => {
    await expectError(await app.handle(new Request("http://localhost/health")), {
      status: 404,
      code: "NOT_FOUND",
    });
  });

  test("allows the configured CORS origin", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health", { headers: { Origin: "http://localhost:5173" } }),
    );

    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
  });
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("request id", () => {
  test("is generated when the client sends none", async () => {
    const response = await app.handle(new Request("http://localhost/api/health"));

    expect(response.headers.get("x-request-id")).toMatch(UUID);
  });

  test("echoes a valid incoming X-Request-Id", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health", { headers: { "X-Request-Id": "trace-42_a.b" } }),
    );

    expect(response.headers.get("x-request-id")).toBe("trace-42_a.b");
  });

  test("replaces an invalid incoming X-Request-Id", async () => {
    const responses = await Promise.all(
      ["a b<script>", "x".repeat(129)].map((invalid) =>
        app.handle(
          new Request("http://localhost/api/health", { headers: { "X-Request-Id": invalid } }),
        ),
      ),
    );

    for (const response of responses) {
      expect(response.headers.get("x-request-id")).toMatch(UUID);
    }
  });

  test("is set on error responses too", async () => {
    const response = await app.handle(new Request("http://localhost/api/does-not-exist"));

    expect(response.status).toBe(404);
    expect(response.headers.get("x-request-id")).toMatch(UUID);
  });
});

const captureLogs = () => {
  const lines: string[] = [];
  const logger = pino({ level: "info" }, { write: (line: string) => lines.push(line) });

  return { logger, entries: () => lines.map((line) => JSON.parse(line)) };
};

describe("request logging", () => {
  const logs = captureLogs();

  const loggedApp = createApp(testConfig({ logger: logs.logger })).get("/boom", () => {
    throw new Error("boom");
  });

  const requestLine = async (path: string) => {
    const response = await loggedApp.handle(new Request(`http://localhost/api${path}`));
    const id = response.headers.get("x-request-id");

    // onAfterResponse runs once the response is handed back, not before.
    await Bun.sleep(0);

    return logs.entries().find((entry) => entry.requestId === id && entry.msg === "request");
  };

  test("writes one line per request with method, path, status and duration", async () => {
    expect(await requestLine("/health")).toMatchObject({
      level: 30,
      method: "GET",
      path: "/api/health",
      status: 200,
      durationMs: expect.any(Number),
    });
  });

  test("records the status of error responses", async () => {
    expect(await requestLine("/does-not-exist")).toMatchObject({ status: 404 });
    expect(await requestLine("/boom")).toMatchObject({ status: 500 });
  });

  test("records the status of requests rejected before routing", async () => {
    const limitedLogs = captureLogs();

    const limited = createApp(
      testConfig({ logger: limitedLogs.logger, rateLimit: { max: 1, windowMs: 60_000 } }),
    ).get("/ping", () => "pong");

    await limited.handle(new Request("http://localhost/api/ping"));
    await limited.handle(new Request("http://localhost/api/ping"));
    await Bun.sleep(0);

    const statuses = limitedLogs.entries().map((entry) => entry.status);

    expect(statuses).toEqual([200, 429]);
  });
});

// Every error, whatever raised it, must come out in the ApiErrorBody format.
const expectError = async (
  response: Response,
  expected: { status: number; code: string; message?: string },
) => {
  const body = await response.json();

  expect(response.status).toBe(expected.status);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(body).toEqual({
    error: expect.objectContaining({
      code: expected.code,
      message: expected.message ?? expect.any(String),
      requestId: response.headers.get("x-request-id"),
    }),
  });

  return body;
};

describe("error handling", () => {
  const logs = captureLogs();

  const failingApp = createApp(testConfig({ logger: logs.logger }))
    .get("/boom", () => {
      throw new Error("database password is hunter2");
    })
    .get("/forbidden", () => {
      throw new ApiError("FORBIDDEN", "You cannot edit this word");
    })
    .get("/conflict", () => {
      throw status(409, "raw Elysia status");
    })
    .post("/words", ({ body }) => body, { body: t.Object({ name: t.String() }) })
    .get("/broken-response", () => ({ id: 42 }), {
      response: t.Object({ id: t.Number({ maximum: 10 }) }),
    });

  test("answers 500 with a generic body and the request id", async () => {
    const response = await failingApp.handle(new Request("http://localhost/api/boom"));
    const body = await expectError(response, { status: 500, code: "INTERNAL_SERVER_ERROR" });

    expect(JSON.stringify(body)).not.toContain("hunter2");
  });

  test("renders a thrown ApiError with its status, code and message", async () => {
    await expectError(await failingApp.handle(new Request("http://localhost/api/forbidden")), {
      status: 403,
      code: "FORBIDDEN",
      message: "You cannot edit this word",
    });
  });

  test("renders an unknown route as NOT_FOUND", async () => {
    await expectError(await failingApp.handle(new Request("http://localhost/api/does-not-exist")), {
      status: 404,
      code: "NOT_FOUND",
    });
  });

  test("renders a thrown Elysia status with the code matching its status", async () => {
    await expectError(await failingApp.handle(new Request("http://localhost/api/conflict")), {
      status: 409,
      code: "CONFLICT",
    });
  });

  test("renders an invalid body as VALIDATION_FAILED with field details", async () => {
    const response = await failingApp.handle(
      new Request("http://localhost/api/words", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: 42 }),
      }),
    );

    const body = await expectError(response, { status: 422, code: "VALIDATION_FAILED" });

    expect(body).toMatchObject({
      error: { details: expect.arrayContaining([{ path: "/name", message: "Expected string" }]) },
    });
  });

  test("renders malformed JSON as BAD_REQUEST", async () => {
    const response = await failingApp.handle(
      new Request("http://localhost/api/words", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{not json",
      }),
    );

    await expectError(response, { status: 400, code: "BAD_REQUEST" });
  });

  test("renders a declared body over the size limit as PAYLOAD_TOO_LARGE", async () => {
    const body = JSON.stringify({ name: "x".repeat(MAX_REQUEST_BODY_SIZE) });

    // A real HTTP client always declares it; a bare Request in tests does not.
    const response = await failingApp.handle(
      new Request("http://localhost/api/words", {
        method: "POST",
        headers: { "content-type": "application/json", "content-length": String(body.length) },
        body,
      }),
    );

    await expectError(response, { status: 413, code: "PAYLOAD_TOO_LARGE" });
  });

  test("treats a response that breaks its own schema as a server error", async () => {
    await expectError(
      await failingApp.handle(new Request("http://localhost/api/broken-response")),
      {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
      },
    );
  });

  test("logs the error with its stack and the request id", async () => {
    const response = await failingApp.handle(new Request("http://localhost/api/boom"));
    const requestIdHeader = response.headers.get("x-request-id");

    expect(logs.entries()).toContainEqual(
      expect.objectContaining({
        level: 50,
        requestId: requestIdHeader,
        err: expect.objectContaining({
          message: "database password is hunter2",
          stack: expect.any(String),
        }),
      }),
    );
  });
});

const limitedApp = (trustProxy: boolean) =>
  createApp(testConfig({ trustProxy, rateLimit: { max: 2, windowMs: 60_000 } })).get(
    "/ping",
    () => "pong",
  );

const pingFrom = (target: ReturnType<typeof limitedApp>, forwardedFors: string[]) =>
  Promise.all(
    forwardedFors.map((forwardedFor) =>
      target.handle(
        new Request("http://localhost/api/ping", { headers: { "X-Forwarded-For": forwardedFor } }),
      ),
    ),
  );

// Requests are fired concurrently on purpose: counting must hold under parallel load.
const countStatus = (responses: Response[], expected: number) =>
  responses.filter((response) => response.status === expected).length;

describe("rate limiting", () => {
  test("answers 429 with Retry-After once the limit is reached", async () => {
    const responses = await pingFrom(limitedApp(false), Array(3).fill("203.0.113.1"));
    const limited = responses.find((response) => response.status === 429);

    expect(countStatus(responses, 200)).toBe(2);
    expect(countStatus(responses, 429)).toBe(1);
    expect(Number(limited?.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(await limited?.json()).toEqual({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: expect.any(String),
        requestId: limited?.headers.get("x-request-id"),
      },
    });
    expect(limited?.headers.get("x-request-id")).toMatch(UUID);
    expect(limited?.headers.get("x-content-type-options")).toBe("nosniff");
  });

  test("never limits /api/health", async () => {
    const target = limitedApp(false);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => target.handle(new Request("http://localhost/api/health"))),
    );

    expect(countStatus(responses, 200)).toBe(5);
  });

  test("keys on X-Forwarded-For only when the proxy is trusted", async () => {
    const ips = ["203.0.113.1, 10.0.0.1", "203.0.113.2, 10.0.0.1", "203.0.113.3, 10.0.0.1"];

    expect(countStatus(await pingFrom(limitedApp(true), ips), 200)).toBe(3);
    expect(countStatus(await pingFrom(limitedApp(false), ips), 429)).toBe(1);
  });
});

describe("api docs", () => {
  test("live under the /api prefix", () => {
    expect([DOCS_PATH, SPEC_PATH]).toEqual(["/api/openapi", "/api/openapi/json"]);
  });

  test("serves the OpenAPI spec with the documented routes", async () => {
    const response = await app.handle(new Request(`http://localhost${SPEC_PATH}`));
    const spec = await response.json();

    expect(response.status).toBe(200);
    expect(spec).toMatchObject({
      info: { title: "Typomaniac API" },
      paths: { "/api/health": { get: { tags: ["System"] } } },
    });
    expect(spec).not.toHaveProperty(["paths", DOCS_PATH]);
  });

  test("documents GET /api/me and Better Auth's endpoints under the Auth tag", async () => {
    const spec = await (await app.handle(new Request(`http://localhost${SPEC_PATH}`))).json();

    expect(spec).toMatchObject({
      tags: expect.arrayContaining([expect.objectContaining({ name: "Auth" })]),
      paths: {
        "/api/me": { get: { tags: ["Auth"] } },
        "/api/auth/sign-in/social": { post: { tags: ["Auth"] } },
        "/api/auth/get-session": { get: { tags: ["Auth"] } },
      },
      components: {
        schemas: { User: expect.anything() },
        securitySchemes: { apiKeyCookie: expect.anything() },
      },
    });
  });

  test("leaves Better Auth's own schema and reference routes unreachable", async () => {
    const responses = await Promise.all(
      ["/api/auth/open-api/generate-schema", "/api/auth/reference"].map((path) =>
        app.handle(new Request(`http://localhost${path}`)),
      ),
    );

    expect(responses.map((response) => response.status)).toEqual([404, 404]);
  });

  test("serves the Scalar page with a CSP that lets it load", async () => {
    const response = await app.handle(new Request(`http://localhost${DOCS_PATH}`));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("content-security-policy")).toContain(
      "script-src https://cdn.jsdelivr.net",
    );
  });

  test("keeps the strict CSP everywhere else", async () => {
    const response = await app.handle(new Request("http://localhost/api/health"));

    expect(response.headers.get("content-security-policy")).toBe(
      "default-src 'none'; frame-ancestors 'none'",
    );
  });

  test("is not exposed in production", async () => {
    const prodApp = createApp(testConfig({ isProduction: true }));

    const responses = await Promise.all(
      [DOCS_PATH, SPEC_PATH, "/api/auth/open-api/generate-schema", "/api/auth/reference"].map(
        (path) => prodApp.handle(new Request(`http://localhost${path}`)),
      ),
    );

    for (const response of responses) {
      expect(response.status).toBe(404);
      expect(response.headers.get("content-security-policy")).toBe(
        "default-src 'none'; frame-ancestors 'none'",
      );
    }
  });
});

describe("auth", () => {
  const auth = createTestAuth();
  const authApp = createApp(testConfig({ auth }));

  const signIn = () =>
    signInAs(auth, { name: "Ada", email: "ada@example.com", image: "https://img/ada" });

  const getMe = (cookie?: string) =>
    authApp.handle(
      new Request("http://localhost/api/me", { headers: cookie ? { cookie } : undefined }),
    );

  test("GET /api/me without a Session answers 401 in the API error format", async () => {
    await expectError(await getMe(), { status: 401, code: "UNAUTHORIZED" });
  });

  test("GET /api/me with a Session returns its User", async () => {
    const { user, cookie } = await signIn();

    const response = await getMe(cookie);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: user.id,
      name: "Ada",
      email: "ada@example.com",
      image: "https://img/ada",
      handle: null,
    });
  });

  test("GET /api/me refreshes the session cookie cache as an httpOnly Lax cookie", async () => {
    const { cookie } = await signIn();

    const setCookie = (await getMe(cookie)).headers.getSetCookie().join("\n");

    expect(setCookie).toContain("better-auth.session_data=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
  });

  test("GET /api/me with an expired Session answers 401", async () => {
    const { token, cookie } = await signIn();
    const context = await auth.$context;

    await context.internalAdapter.updateSession(token, { expiresAt: new Date(Date.now() - 1000) });

    await expectError(await getMe(cookie), { status: 401, code: "UNAUTHORIZED" });
  });

  test("GET /api/me answers 401 once signed out through /api/auth", async () => {
    const { cookie } = await signIn();

    const signOut = await authApp.handle(
      new Request("http://localhost/api/auth/sign-out", {
        method: "POST",
        headers: { cookie, origin: FRONT_ORIGIN },
      }),
    );

    expect(signOut.status).toBe(200);
    await expectError(await getMe(cookie), { status: 401, code: "UNAUTHORIZED" });
  });

  test("lets the front send its cookie cross-origin", async () => {
    const response = await authApp.handle(
      new Request("http://localhost/api/me", { headers: { Origin: FRONT_ORIGIN } }),
    );

    expect(response.headers.get("access-control-allow-origin")).toBe(FRONT_ORIGIN);
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  });
});

describe("pace", () => {
  const auth = createTestAuth();
  const duels = memoryDuelStore();
  const paceApp = createApp(testConfig({ auth, duelStore: duels.store }));

  const getPace = (cookie?: string) =>
    paceApp.handle(
      new Request("http://localhost/api/me/pace", { headers: cookie ? { cookie } : undefined }),
    );

  test("GET /api/me/pace without a Session answers 401", async () => {
    await expectError(await getPace(), { status: 401, code: "UNAUTHORIZED" });
  });

  test("GET /api/me/pace is the default Pace for a User without any Duel", async () => {
    const { cookie } = await signInAs(auth, { name: "Ada", email: "ada-new@example.com" });

    const response = await getPace(cookie);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ pace: defaultPace });
  });

  test("GET /api/me/pace is the median wpm of the User's last Duels", async () => {
    const { user, cookie } = await signInAs(auth, { name: "Alan", email: "alan@example.com" });

    duels.saved.push(
      pastDuel(user.id, 60, 3000),
      pastDuel(user.id, 90, 2000),
      pastDuel(user.id, 81, 1000),
      pastDuel("someone", 200, 4000),
    );

    expect(await (await getPace(cookie)).json()).toEqual({ pace: 81 });
  });
});

type ProviderProfile = { id: string; email: string; emailVerified: boolean };

// A provider that takes the id token as its profile's key: signing in through
// POST /sign-in/social with `idToken` runs Better Auth's real User and Account
// handling, without the OAuth round trip. `subject` builds the raw profile field
// the provider keys its Accounts on (`id`, or `sub` for Google).
const fakeProvider = <Profile>(
  profiles: Map<string, ProviderProfile>,
  subject: (id: string) => Partial<Profile>,
) => ({
  clientId: "id",
  clientSecret: "secret",
  verifyIdToken: async (token: string) => profiles.has(token),
  getUserInfo: async ({ idToken }: OAuth2Tokens) => {
    const profile = profiles.get(idToken ?? "");

    if (!profile) {
      return null;
    }

    const { id, email, emailVerified } = profile;

    // SAFETY: with getUserInfo overridden, Better Auth reads only the account subject
    // from the raw profile, and `subject` sets it.
    const data = subject(id) as Profile;

    return { user: { email, emailVerified, name: email }, data };
  },
});

const fakeProviders = (profiles: Map<string, ProviderProfile>) => ({
  github: fakeProvider<GithubProfile>(profiles, (id) => ({ id })),
  google: fakeProvider<GoogleProfile>(profiles, (sub) => ({ sub })),
  discord: fakeProvider<DiscordProfile>(profiles, (id) => ({ id })),
});

// The production auth options with fake providers in place of the configured ones.
const createSocialAuth = (
  socialProviders: BetterAuthOptions["socialProviders"],
  { rateLimited = true } = {},
) => {
  const options = testAuthOptions();

  return betterAuth({
    ...options,
    socialProviders,
    rateLimit: { ...options.rateLimit, enabled: rateLimited },
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    logger: { disabled: true },
  });
};

const signInRequest = (providerId: string, token: string, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/auth/sign-in/social", {
    method: "POST",
    headers: { "content-type": "application/json", origin: FRONT_ORIGIN, ...headers },
    body: JSON.stringify({ provider: providerId, idToken: { token } }),
  });

describe("social sign-in", () => {
  const profiles = new Map<string, ProviderProfile>();
  // The tests share one instance and all come from the same address: Better Auth's
  // sign-in limit would refuse them. It has its own tests below.
  const auth = createSocialAuth(fakeProviders(profiles), { rateLimited: false });
  const socialApp = createApp(testConfig({ auth }));

  const signInWith = (providerId: string, profile: ProviderProfile, target = socialApp) => {
    const token = `${providerId}:${profile.id}`;

    profiles.set(token, profile);

    return target.handle(signInRequest(providerId, token));
  };

  const accountsOf = async (email: string) => {
    const context = await auth.$context;
    const found = await context.internalAdapter.findUserByEmail(email, { includeAccounts: true });

    return new Set(found?.accounts.map((account) => account.providerId));
  };

  test("refuses a provider that is not configured", async () => {
    const githubOnly = createApp(
      testConfig({ auth: createSocialAuth({ github: fakeProviders(profiles).github }) }),
    );

    const profile = { id: "0", email: "alan@example.com", emailVerified: true };

    expect((await signInWith("github", profile, githubOnly)).status).toBe(200);
    expect((await signInWith("discord", profile, githubOnly)).status).toBe(404);
  });

  test("links a Google Account to the GitHub User with the same email", async () => {
    const email = "grace@example.com";

    expect((await signInWith("github", { id: "1", email, emailVerified: true })).status).toBe(200);
    expect((await signInWith("google", { id: "2", email, emailVerified: true })).status).toBe(200);

    expect(await accountsOf(email)).toEqual(new Set(["github", "google"]));
  });

  test("trusts GitHub and Google even when they do not mark the email verified", async () => {
    const email = "linus@example.com";

    await signInWith("discord", { id: "3", email, emailVerified: true });
    await signInWith("github", { id: "4", email, emailVerified: false });
    await signInWith("google", { id: "5", email, emailVerified: false });

    expect(await accountsOf(email)).toEqual(new Set(["discord", "github", "google"]));
  });

  test("links a Discord Account whose email Discord verified", async () => {
    const email = "ken@example.com";

    await signInWith("github", { id: "6", email, emailVerified: true });
    const response = await signInWith("discord", { id: "7", email, emailVerified: true });

    expect(response.status).toBe(200);
    expect(await accountsOf(email)).toEqual(new Set(["discord", "github"]));
  });

  test("refuses to link a Discord Account whose email is not verified", async () => {
    const email = "barbara@example.com";

    await signInWith("github", { id: "8", email, emailVerified: true });
    const response = await signInWith("discord", { id: "9", email, emailVerified: false });

    expect(response.status).toBe(401);
    expect(await accountsOf(email)).toEqual(new Set(["github"]));
  });
});

// Better Auth allows 3 sign-in attempts per 10 seconds and per IP, far below our
// global limit.
const SIGN_IN_LIMIT = 3;

const signInApp = (trustProxy: boolean) => {
  const profiles = new Map([["alan", { id: "1", email: "alan@example.com", emailVerified: true }]]);

  return createApp(
    testConfig({ trustProxy, auth: createSocialAuth({ github: fakeProviders(profiles).github }) }),
  );
};

// One more attempt than allowed, each with its own value of `header`.
const signInAttempts = (target: ReturnType<typeof signInApp>, header: string, values: string[]) =>
  Promise.all(
    values.map((value) => target.handle(signInRequest("github", "alan", { [header]: value }))),
  );

const OVER_LIMIT = SIGN_IN_LIMIT + 1;

const distinctIps = Array.from({ length: OVER_LIMIT }, (_, i) => `203.0.113.${i + 1}`);

describe("sign-in rate limiting", () => {
  test("refuses sign-in attempts beyond Better Auth's limit, well under the global one", async () => {
    const sameIp = Array<string>(OVER_LIMIT).fill("203.0.113.1");
    const responses = await signInAttempts(signInApp(true), "X-Forwarded-For", sameIp);

    expect(countStatus(responses, 200)).toBe(SIGN_IN_LIMIT);
    expect(countStatus(responses, 429)).toBe(1);
  });

  test("a forged X-Forwarded-For does not get around it when the proxy is not trusted", async () => {
    const responses = await signInAttempts(signInApp(false), "X-Forwarded-For", distinctIps);

    expect(countStatus(responses, 429)).toBe(1);
  });

  test("keys on X-Forwarded-For when the proxy is trusted, like the global limit", async () => {
    const responses = await signInAttempts(signInApp(true), "X-Forwarded-For", distinctIps);

    expect(countStatus(responses, 200)).toBe(OVER_LIMIT);
  });

  test("ignores a client-sent copy of the header Better Auth reads the IP from", async () => {
    const responses = await signInAttempts(signInApp(false), CLIENT_IP_HEADER, distinctIps);

    expect(countStatus(responses, 429)).toBe(1);
  });
});

// The test options on the memory database, in or out of production. Better Auth's
// sign-in limit would refuse the tests that share an instance: it has its own tests.
const createEmailAuth = (isProduction: boolean) => {
  const options = testAuthOptions({ isProduction });

  return betterAuth({
    ...options,
    rateLimit: { ...options.rateLimit, enabled: false },
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    logger: { disabled: true },
  });
};

const emailRequest = (path: "sign-up" | "sign-in", body: Record<string, string>) =>
  new Request(`http://localhost/api/auth/${path}/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: FRONT_ORIGIN },
    body: JSON.stringify(body),
  });

const sessionCookie = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");

describe("email and password", () => {
  const devApp = createApp(testConfig({ auth: createEmailAuth(false) }));
  const credentials = { email: "bob@dev.test", password: "a-dev-password" };

  const getMe = (cookie: string) =>
    devApp.handle(new Request("http://localhost/api/me", { headers: { cookie } }));

  test("signs up a User without any verification out of production", async () => {
    const signUp = await devApp.handle(emailRequest("sign-up", { ...credentials, name: "bob" }));

    expect(signUp.status).toBe(200);

    const me = await getMe(sessionCookie(signUp));

    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ name: "bob", email: credentials.email });
  });

  test("signs that User back in with its password", async () => {
    const signIn = await devApp.handle(emailRequest("sign-in", credentials));

    expect(signIn.status).toBe(200);
    expect((await getMe(sessionCookie(signIn))).status).toBe(200);
  });

  test("refuses a wrong password", async () => {
    const signIn = await devApp.handle(
      emailRequest("sign-in", { ...credentials, password: "not-the-password" }),
    );

    expect(signIn.status).toBe(401);
  });

  test("answers 404 on both routes in production", async () => {
    const prodApp = createApp(testConfig({ auth: createEmailAuth(true) }));

    const responses = await Promise.all([
      prodApp.handle(emailRequest("sign-up", { ...credentials, name: "bob" })),
      prodApp.handle(emailRequest("sign-in", credentials)),
    ]);

    expect(responses.map((response) => response.status)).toEqual([404, 404]);
  });
});

describe("security headers", () => {
  test("are set on every response, errors included", async () => {
    const responses = await Promise.all(
      ["/api/health", "/api/does-not-exist"].map((path) =>
        app.handle(new Request(`http://localhost${path}`)),
      ),
    );

    for (const response of responses) {
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("x-frame-options")).toBe("DENY");
      expect(response.headers.get("content-security-policy")).toBe(
        "default-src 'none'; frame-ancestors 'none'",
      );
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
      expect(response.headers.get("cross-origin-resource-policy")).toBe("same-site");
      expect(response.headers.get("cross-origin-opener-policy")).toBe("same-origin");
    }
  });

  test("HSTS is only sent in production", async () => {
    const devResponse = await app.handle(new Request("http://localhost/api/health"));

    const prodResponse = await createApp(testConfig({ isProduction: true })).handle(
      new Request("http://localhost/api/health"),
    );

    expect(devResponse.headers.get("strict-transport-security")).toBeNull();
    expect(prodResponse.headers.get("strict-transport-security")).toBe(
      "max-age=31536000; includeSubDomains",
    );
  });
});
