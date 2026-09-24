import { betterAuth, type BetterAuthOptions, type BetterAuthRateLimitOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";

import { type Table, table } from "../../database/schema";
import { API_PREFIX } from "../../lib/api-prefix";
import type { SocialProviders } from "../../parse-env";
import { CLIENT_IP_HEADER } from "../../plugins/client-ip";
import { FixedWindowStore } from "../../plugins/fixed-window-store";

// Registered under createApp's prefix.
export const AUTH_ROUTE = "/auth";

// Better Auth's basePath: it routes on the full URL.
export const AUTH_PATH = `${API_PREFIX}${AUTH_ROUTE}`;

const DAY_SECONDS = 60 * 60 * 24;

type RateLimitStorage = NonNullable<BetterAuthRateLimitOptions["customStorage"]>;

// Better Auth's counters on our FixedWindowStore, one store per window length (its
// rules use a few: 10 s for sign-in, 60 s for others). Its default memory store is a
// module-wide Map shared by every instance; this one belongs to its instance.
const rateLimitStorage = (): RateLimitStorage => {
  const stores = new Map<number, FixedWindowStore>();

  const storeFor = (windowSeconds: number) => {
    const existing = stores.get(windowSeconds);

    if (existing) {
      return existing;
    }

    const store = new FixedWindowStore({ windowMs: windowSeconds * 1000 });

    stores.set(windowSeconds, store);

    return store;
  };

  return {
    consume: async (key, rule) => {
      const window = storeFor(rule.window).increment(key);

      if (window.count <= rule.max) {
        return { allowed: true, retryAfter: null };
      }

      return {
        allowed: false,
        retryAfter: Math.max(0, Math.ceil((window.nextReset.getTime() - Date.now()) / 1000)),
      };
    },
  };
};

export type AuthSettings = {
  secret: string;
  baseURL: string;
  // The front's origin: the only one allowed to start a flow and send the cookie.
  trustedOrigin: string;
  socialProviders: SocialProviders;
  isProduction: boolean;
};

// The schema is only read server side (auth.api.generateOpenAPISchema) and merged into
// our own spec, off in production: the plugin's routes answer 404 over HTTP.
const OPEN_API_PATHS = ["/open-api/generate-schema", "/reference"];

// Email and password is a dev tool to open several Users (ADR 0005): in production its
// routes answer 404, like a provider that is not configured.
const EMAIL_PASSWORD_PATHS = ["/sign-up/email", "/sign-in/email"];

// Everything but the database, so tests run the same config on the memory adapter.
export const authOptions = ({
  secret,
  baseURL,
  trustedOrigin,
  socialProviders,
  isProduction,
}: AuthSettings) =>
  ({
    secret,
    baseURL,
    basePath: AUTH_PATH,
    trustedOrigins: [trustedOrigin],
    socialProviders,
    // The Handle, lowercased, null until the User chooses it. Never set by a sign-up: only
    // through its own route (src/modules/handle), which checks it.
    user: {
      additionalFields: {
        handle: { type: "string", required: false, input: false, unique: true },
      },
    },
    // No email is ever sent: the address is not checked, the User stays unverified.
    emailAndPassword: { enabled: !isProduction },
    plugins: [openAPI({ disableDefaultReference: true })],
    disabledPaths: isProduction ? [...OPEN_API_PATHS, ...EMAIL_PASSWORD_PATHS] : OPEN_API_PATHS,
    // Signing in with a second provider finds the User with the same email. GitHub and
    // Google only hand out addresses they own or checked: trusted. Discord is linked
    // only when it marks the email verified, otherwise anyone could claim an address.
    account: {
      accountLinking: { enabled: true, trustedProviders: ["github", "google"] },
    },
    // Stored in the database for 30 days, pushed back by a day at most once a day of
    // use. The short cookie cache spares a database read on every request.
    session: {
      expiresIn: 30 * DAY_SECONDS,
      updateAge: DAY_SECONDS,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    // On top of our global limit, in every environment: Better Auth's stricter rules
    // on its sensitive endpoints (3 sign-in attempts per 10 s and per IP).
    rateLimit: { enabled: true, customStorage: rateLimitStorage() },
    advanced: {
      // Front and API are two subdomains of the same site in production: Lax is enough.
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
      // The client IP our rate limit resolved (TRUST_PROXY), passed on by the
      // authentication plugin. Never X-Forwarded-For directly: anyone can forge it.
      ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
    },
    telemetry: { enabled: false },
  }) satisfies BetterAuthOptions;

// The database type, not the client: importing the client would pull env.ts into the
// graph app.ts (and so the front) typechecks.
export const createAuth = (settings: AuthSettings, db: BunSQLDatabase<Table>) =>
  betterAuth({
    ...authOptions(settings),
    database: drizzleAdapter(db, { provider: "pg", schema: table }),
  });

export type Auth = ReturnType<typeof createAuth>;
