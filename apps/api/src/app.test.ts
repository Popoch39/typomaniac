import { describe, expect, test } from "bun:test";
import pino from "pino";

import { type AppConfig, createApp } from "./app";

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
  test("GET /health answers ok", async () => {
    const response = await app.handle(new Request("http://localhost/health"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  test("allows the configured CORS origin", async () => {
    const response = await app.handle(
      new Request("http://localhost/health", { headers: { Origin: "http://localhost:5173" } }),
    );

    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
  });
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("request id", () => {
  test("is generated when the client sends none", async () => {
    const response = await app.handle(new Request("http://localhost/health"));

    expect(response.headers.get("x-request-id")).toMatch(UUID);
  });

  test("echoes a valid incoming X-Request-Id", async () => {
    const response = await app.handle(
      new Request("http://localhost/health", { headers: { "X-Request-Id": "trace-42_a.b" } }),
    );

    expect(response.headers.get("x-request-id")).toBe("trace-42_a.b");
  });

  test("replaces an invalid incoming X-Request-Id", async () => {
    const responses = await Promise.all(
      ["a b<script>", "x".repeat(129)].map((invalid) =>
        app.handle(
          new Request("http://localhost/health", { headers: { "X-Request-Id": invalid } }),
        ),
      ),
    );

    for (const response of responses) {
      expect(response.headers.get("x-request-id")).toMatch(UUID);
    }
  });

  test("is set on error responses too", async () => {
    const response = await app.handle(new Request("http://localhost/does-not-exist"));

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
    const response = await loggedApp.handle(new Request(`http://localhost${path}`));
    const id = response.headers.get("x-request-id");

    // onAfterResponse runs once the response is handed back, not before.
    await Bun.sleep(0);

    return logs.entries().find((entry) => entry.requestId === id && entry.msg === "request");
  };

  test("writes one line per request with method, path, status and duration", async () => {
    expect(await requestLine("/health")).toMatchObject({
      level: 30,
      method: "GET",
      path: "/health",
      status: 200,
      durationMs: expect.any(Number),
    });
  });

  test("records the status of error responses", async () => {
    expect(await requestLine("/does-not-exist")).toMatchObject({ status: 404 });
    expect(await requestLine("/boom")).toMatchObject({ status: 500 });
  });

  test("records the status of responses returned as a Response object", async () => {
    const limitedLogs = captureLogs();

    const limited = createApp(
      testConfig({ logger: limitedLogs.logger, rateLimit: { max: 1, windowMs: 60_000 } }),
    ).get("/ping", () => "pong");

    await limited.handle(new Request("http://localhost/ping"));
    await limited.handle(new Request("http://localhost/ping"));
    await Bun.sleep(0);

    const statuses = limitedLogs.entries().map((entry) => entry.status);

    expect(statuses).toEqual([200, 429]);
  });
});

describe("error handling", () => {
  const logs = captureLogs();

  const failingApp = createApp(testConfig({ logger: logs.logger })).get("/boom", () => {
    throw new Error("database password is hunter2");
  });

  test("answers 500 with a generic body and the request id", async () => {
    const response = await failingApp.handle(new Request("http://localhost/boom"));
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(JSON.parse(body)).toEqual({
      error: "Internal Server Error",
      requestId: response.headers.get("x-request-id"),
    });
    expect(body).not.toContain("hunter2");
  });

  test("logs the error with its stack and the request id", async () => {
    const response = await failingApp.handle(new Request("http://localhost/boom"));
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

  test("keeps Elysia's answer for client errors", async () => {
    const response = await failingApp.handle(new Request("http://localhost/does-not-exist"));

    expect(response.status).toBe(404);
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
        new Request("http://localhost/ping", { headers: { "X-Forwarded-For": forwardedFor } }),
      ),
    ),
  );

// Requests are fired concurrently on purpose: counting must hold under parallel load.
const countStatus = (responses: Response[], status: number) =>
  responses.filter((response) => response.status === status).length;

describe("rate limiting", () => {
  test("answers 429 with Retry-After once the limit is reached", async () => {
    const responses = await pingFrom(limitedApp(false), Array(3).fill("203.0.113.1"));
    const limited = responses.find((response) => response.status === 429);

    expect(countStatus(responses, 200)).toBe(2);
    expect(countStatus(responses, 429)).toBe(1);
    expect(Number(limited?.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(await limited?.json()).toEqual({ error: "Too Many Requests" });
    expect(limited?.headers.get("x-request-id")).toMatch(UUID);
    expect(limited?.headers.get("x-content-type-options")).toBe("nosniff");
  });

  test("never limits /health", async () => {
    const target = limitedApp(false);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => target.handle(new Request("http://localhost/health"))),
    );

    expect(countStatus(responses, 200)).toBe(5);
  });

  test("keys on X-Forwarded-For only when the proxy is trusted", async () => {
    const ips = ["203.0.113.1, 10.0.0.1", "203.0.113.2, 10.0.0.1", "203.0.113.3, 10.0.0.1"];

    expect(countStatus(await pingFrom(limitedApp(true), ips), 200)).toBe(3);
    expect(countStatus(await pingFrom(limitedApp(false), ips), 429)).toBe(1);
  });
});

describe("security headers", () => {
  test("are set on every response, errors included", async () => {
    const responses = await Promise.all(
      ["/health", "/does-not-exist"].map((path) =>
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
    const devResponse = await app.handle(new Request("http://localhost/health"));

    const prodResponse = await createApp(testConfig({ isProduction: true })).handle(
      new Request("http://localhost/health"),
    );

    expect(devResponse.headers.get("strict-transport-security")).toBeNull();
    expect(prodResponse.headers.get("strict-transport-security")).toBe(
      "max-age=31536000; includeSubDomains",
    );
  });
});
