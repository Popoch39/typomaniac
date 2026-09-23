import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";

import { type Table, table } from "./database/schema";
import type { SocialProviders } from "./parse-env";
import { AUTH_PATH } from "./plugins/authentication";

const DAY_SECONDS = 60 * 60 * 24;

export type AuthSettings = {
  secret: string;
  baseURL: string;
  // The front's origin: the only one allowed to start a flow and send the cookie.
  trustedOrigin: string;
  socialProviders: SocialProviders;
};

// Everything but the database, so tests run the same config on the memory adapter.
export const authOptions = ({ secret, baseURL, trustedOrigin, socialProviders }: AuthSettings) =>
  ({
    secret,
    baseURL,
    basePath: AUTH_PATH,
    trustedOrigins: [trustedOrigin],
    socialProviders,
    // The schema is only read server side (auth.api.generateOpenAPISchema) and merged
    // into our own spec, off in production: the plugin's routes answer 404 over HTTP.
    plugins: [openAPI({ disableDefaultReference: true })],
    disabledPaths: ["/open-api/generate-schema", "/reference"],
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
    // Front and API are two subdomains of the same site in production: Lax is enough.
    advanced: { defaultCookieAttributes: { httpOnly: true, sameSite: "lax" } },
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
