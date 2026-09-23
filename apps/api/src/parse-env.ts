import { Value } from "@sinclair/typebox/value";
import { t } from "elysia";

const EnvSchema = t.Object({
  DATABASE_URL: t.String({ minLength: 1 }),
  PORT: t.Number({ default: 3000 }),
  CORS_ORIGIN: t.String({ minLength: 1, default: "http://localhost:5173" }),
  NODE_ENV: t.UnionEnum(["development", "production", "test"], { default: "development" }),
  LOG_LEVEL: t.UnionEnum(["fatal", "error", "warn", "info", "debug", "trace", "silent"], {
    default: "info",
  }),
  // Only enable behind a reverse proxy: X-Forwarded-For is spoofable otherwise.
  TRUST_PROXY: t.Boolean({ default: false }),
  RATE_LIMIT_MAX: t.Integer({ minimum: 1, default: 100 }),
  RATE_LIMIT_WINDOW_MS: t.Integer({ minimum: 1, default: 60_000 }),
});

export type Env = typeof EnvSchema.static;

export const parseEnv = (source: NodeJS.ProcessEnv): Env => Value.Parse(EnvSchema, source);
