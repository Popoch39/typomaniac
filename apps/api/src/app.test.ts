import { describe, expect, test } from "bun:test";
import { status, t } from "elysia";
import pino from "pino";

import { type AppConfig, createApp } from "./app";
import { ApiError } from "./errors";
import { DOCS_PATH, SPEC_PATH } from "./plugins/api-docs";
import { MAX_REQUEST_BODY_SIZE } from "./plugins/body-limit";

const testConfig = (overrides: Partial<AppConfig> = {}): AppConfig => ({
  corsOrigin: "http://localhost:5173",
  isProduction: false,
  trustProxy: false,
  rateLimit: { max: 1000, windowMs: 60_000 },
  logger: pino({ level: "silent" }),
  ...overrides,
});

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

    expect(body.error.details).toContainEqual({ path: "/name", message: "Expected string" });
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
    expect(spec.info.title).toBe("Typomaniac API");
    expect(spec.paths["/api/health"].get).toMatchObject({ tags: ["System"] });
    expect(spec.paths[DOCS_PATH]).toBeUndefined();
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
      [DOCS_PATH, SPEC_PATH].map((path) => prodApp.handle(new Request(`http://localhost${path}`))),
    );

    for (const response of responses) {
      expect(response.status).toBe(404);
      expect(response.headers.get("content-security-policy")).toBe(
        "default-src 'none'; frame-ancestors 'none'",
      );
    }
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
