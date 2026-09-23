import { describe, expect, test } from "bun:test";

import { parseEnv } from "./parse-env";

describe("parseEnv", () => {
  test("reads DATABASE_URL and converts PORT to a number", () => {
    const env = parseEnv({
      DATABASE_URL: "postgres://u:p@localhost:5434/db",
      PORT: "4000",
      CORS_ORIGIN: "https://typomaniac.example",
    });

    expect(env).toMatchObject({
      DATABASE_URL: "postgres://u:p@localhost:5434/db",
      PORT: 4000,
      CORS_ORIGIN: "https://typomaniac.example",
    });
  });

  test("defaults logging, proxy and rate limit settings", () => {
    const env = parseEnv({ DATABASE_URL: "postgres://localhost/db" });

    expect(env).toMatchObject({
      NODE_ENV: "development",
      LOG_LEVEL: "info",
      TRUST_PROXY: false,
      RATE_LIMIT_MAX: 100,
      RATE_LIMIT_WINDOW_MS: 60_000,
    });
  });

  test("converts logging, proxy and rate limit settings", () => {
    const env = parseEnv({
      DATABASE_URL: "postgres://localhost/db",
      NODE_ENV: "production",
      LOG_LEVEL: "warn",
      TRUST_PROXY: "true",
      RATE_LIMIT_MAX: "20",
      RATE_LIMIT_WINDOW_MS: "1000",
    });

    expect(env).toMatchObject({
      NODE_ENV: "production",
      LOG_LEVEL: "warn",
      TRUST_PROXY: true,
      RATE_LIMIT_MAX: 20,
      RATE_LIMIT_WINDOW_MS: 1000,
    });
  });

  test("rejects an unknown LOG_LEVEL", () => {
    expect(() =>
      parseEnv({ DATABASE_URL: "postgres://localhost/db", LOG_LEVEL: "loud" }),
    ).toThrow();
  });

  test("defaults PORT to 3000", () => {
    expect(parseEnv({ DATABASE_URL: "postgres://localhost/db" }).PORT).toBe(3000);
  });

  test("defaults CORS_ORIGIN to the Vite dev server", () => {
    expect(parseEnv({ DATABASE_URL: "postgres://localhost/db" }).CORS_ORIGIN).toBe(
      "http://localhost:5173",
    );
  });

  test("throws when DATABASE_URL is missing", () => {
    expect(() => parseEnv({ PORT: "3000" })).toThrow();
  });
});
