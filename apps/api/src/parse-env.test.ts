import { describe, expect, test } from "bun:test";

import { parseEnv } from "./parse-env";

// The variables without a default: every other test starts from these.
const REQUIRED = {
  DATABASE_URL: "postgres://localhost/db",
  BETTER_AUTH_SECRET: "a-secret-of-at-least-thirty-two-chars",
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  test("reads DATABASE_URL and converts PORT to a number", () => {
    const env = parseEnv({
      ...REQUIRED,
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
    const env = parseEnv(REQUIRED);

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
      ...REQUIRED,
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
    expect(() => parseEnv({ ...REQUIRED, LOG_LEVEL: "loud" })).toThrow();
  });

  test("defaults PORT to 3000", () => {
    expect(parseEnv(REQUIRED).PORT).toBe(3000);
  });

  test("defaults CORS_ORIGIN to the Vite dev server", () => {
    expect(parseEnv(REQUIRED).CORS_ORIGIN).toBe("http://localhost:5173");
  });

  test("throws when DATABASE_URL is missing", () => {
    expect(() => parseEnv({ ...REQUIRED, DATABASE_URL: undefined })).toThrow();
  });

  test("reads the auth secret and public URL", () => {
    expect(parseEnv(REQUIRED)).toMatchObject({
      BETTER_AUTH_SECRET: REQUIRED.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: "http://localhost:3000",
    });
  });

  test("throws when the auth secret or public URL is missing", () => {
    expect(() => parseEnv({ ...REQUIRED, BETTER_AUTH_SECRET: undefined })).toThrow();
    expect(() => parseEnv({ ...REQUIRED, BETTER_AUTH_URL: undefined })).toThrow();
  });

  test("rejects an auth secret too short to be safe", () => {
    expect(() => parseEnv({ ...REQUIRED, BETTER_AUTH_SECRET: "short" })).toThrow();
  });
});

describe("parseEnv social providers", () => {
  test("enables GitHub when both its client id and secret are set", () => {
    const env = parseEnv({
      ...REQUIRED,
      GITHUB_CLIENT_ID: "github-id",
      GITHUB_CLIENT_SECRET: "github-secret",
    });

    expect(env.socialProviders).toEqual({
      github: { clientId: "github-id", clientSecret: "github-secret" },
    });
  });

  test("enables no provider when none is configured", () => {
    expect(parseEnv(REQUIRED).socialProviders).toEqual({});
  });

  test("never enables a provider with only half of its credentials", () => {
    const halves = [
      { GITHUB_CLIENT_ID: "github-id" },
      { GITHUB_CLIENT_SECRET: "github-secret" },
      { GITHUB_CLIENT_ID: "github-id", GITHUB_CLIENT_SECRET: "" },
    ];

    for (const half of halves) {
      expect(parseEnv({ ...REQUIRED, ...half }).socialProviders).toEqual({});
    }
  });
});
