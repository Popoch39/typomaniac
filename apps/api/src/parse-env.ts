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
  GOOGLE_CLIENT_ID: t.Optional(t.String()),
  GOOGLE_CLIENT_SECRET: t.Optional(t.String()),
  DISCORD_CLIENT_ID: t.Optional(t.String()),
  DISCORD_CLIENT_SECRET: t.Optional(t.String()),
  // The S3 storage of the Photos (SeaweedFS), all four or none: without it, no Photo is sent.
  S3_ENDPOINT: t.Optional(t.String()),
  S3_BUCKET: t.Optional(t.String()),
  S3_ACCESS_KEY_ID: t.Optional(t.String()),
  S3_SECRET_ACCESS_KEY: t.Optional(t.String()),
});

type ParsedEnv = typeof EnvSchema.static;

type OAuthClient = { clientId: string; clientSecret: string };

export type SocialProviders = { github?: OAuthClient; google?: OAuthClient; discord?: OAuthClient };

export type PhotoStorage = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export type Env = ParsedEnv & {
  socialProviders: SocialProviders;
  photoStorage: PhotoStorage | null;
};

// Like a provider's credentials: all set enables it, none leaves it off, some is a mistake that
// stops the server rather than silently drop the Photos.
const photoStorageOf = (env: ParsedEnv): PhotoStorage | null => {
  const storage = {
    endpoint: env.S3_ENDPOINT,
    bucket: env.S3_BUCKET,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  };

  const { endpoint, bucket, accessKeyId, secretAccessKey } = storage;

  if (endpoint && bucket && accessKeyId && secretAccessKey) {
    return { endpoint, bucket, accessKeyId, secretAccessKey };
  }

  if (Object.values(storage).some(Boolean)) {
    throw new Error(
      "S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be set together",
    );
  }

  return null;
};

type Credentials = { prefix: string; clientId?: string; clientSecret?: string };

const credentialsOf = (env: ParsedEnv) =>
  ({
    github: {
      prefix: "GITHUB",
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      prefix: "GOOGLE",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    discord: {
      prefix: "DISCORD",
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    },
  }) satisfies Record<keyof SocialProviders, Credentials>;

// Both halves set enables the provider, neither leaves it off. A single half is a
// configuration mistake: refuse to start rather than silently drop the provider.
const oauthClientOf = ({ prefix, clientId, clientSecret }: Credentials) => {
  if (!clientId && !clientSecret) {
    return undefined;
  }

  if (!clientId || !clientSecret) {
    throw new Error(`${prefix}_CLIENT_ID and ${prefix}_CLIENT_SECRET must be set together`);
  }

  return { clientId, clientSecret };
};

const socialProvidersOf = (env: ParsedEnv) => {
  const credentials = credentialsOf(env);
  const providers: SocialProviders = {};

  for (const provider of ["github", "google", "discord"] as const) {
    const client = oauthClientOf(credentials[provider]);

    if (client) {
      providers[provider] = client;
    }
  }

  return providers;
};

export const parseEnv = (source: NodeJS.ProcessEnv): Env => {
  const env = Value.Parse(EnvSchema, source);

  return { ...env, socialProviders: socialProvidersOf(env), photoStorage: photoStorageOf(env) };
};
