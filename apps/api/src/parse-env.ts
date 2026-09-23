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
  // Signs the session cookies: `openssl rand -base64 32`.
  BETTER_AUTH_SECRET: t.String({ minLength: 32 }),
  // The API's public URL, OAuth callbacks are built on it.
  BETTER_AUTH_URL: t.String({ minLength: 1 }),
  // Empty counts as unset: `.env.example` lists them blank.
  GITHUB_CLIENT_ID: t.Optional(t.String()),
  GITHUB_CLIENT_SECRET: t.Optional(t.String()),
});

type OAuthClient = { clientId: string; clientSecret: string };

export type SocialProviders = { github?: OAuthClient };

export type Env = typeof EnvSchema.static & { socialProviders: SocialProviders };

// A provider is only enabled with both halves of its credentials: a half-configured
// one would show up in the flow and fail at the provider.
const socialProvidersOf = (env: typeof EnvSchema.static) => {
  const providers: SocialProviders = {};

  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.github = { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET };
  }

  return providers;
};

export const parseEnv = (source: NodeJS.ProcessEnv): Env => {
  const env = Value.Parse(EnvSchema, source);

  return { ...env, socialProviders: socialProvidersOf(env) };
};
