import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import { HANDLE_SEARCH_MIN_LENGTH } from "handle";
import type { Logger } from "pino";

import { API_PREFIX } from "./api-prefix";
import type { Clock } from "./clock";
import { duelRoute } from "./duel/duel-route";
import { type DuelStore, readPace } from "./duel/duel-store";
import { MAX_DUEL_MESSAGE_SIZE } from "./duel/protocol";
import { apiDocs } from "./plugins/api-docs";
import { checkHandle, HANDLE_UNAVAILABLE, setHandle } from "./handle/handle-service";
import { type AuthHandler, authentication, readSession } from "./plugins/authentication";
import { bodyLimit } from "./plugins/body-limit";
import { errorHandler } from "./plugins/error-handler";
import { keyedRateLimit, type RateLimit, rateLimit } from "./plugins/rate-limit";
import { requestId } from "./plugins/request-id";
import { requestLogger } from "./plugins/request-logger";
import { securityHeaders } from "./plugins/security-headers";
import { RELATIONS, searchUsers } from "./user-search/user-search-service";
import type { Users } from "./users";

export type { ApiErrorBody, ErrorCode, ErrorDetail } from "./errors";

export type { ClientMessage, ServerMessage } from "./duel/protocol";

export type AppConfig = {
  corsOrigin: string;
  isProduction: boolean;
  trustProxy: boolean;
  rateLimit: { max: number; windowMs: number };
  logger: Logger;
  // Built by the entry point (src/auth.ts) from the env, like the logger.
  auth: AuthHandler;
  // The Users past the Session (Handles, profiles): on the auth's database.
  users: Users;
  // The Duel's time source (Countdown, server time sent to the clients).
  clock: Clock;
  // Where finished Duels are written: Drizzle in production, in memory in the tests.
  duelStore: DuelStore;
  // Per User, stricter than the global limit: the search must not dump the Handles.
  searchRateLimit: RateLimit;
};

const MeResponse = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
  image: t.Nullable(t.String()),
  // Null until the User chooses it: the front asks for it.
  handle: t.Nullable(t.String()),
});

type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  handle?: string | null;
};

const meOf = (user: SessionUser) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image ?? null,
  handle: user.handle ?? null,
});

const HandleUnavailable = t.UnionEnum(HANDLE_UNAVAILABLE);

// Any length: a Handle too long is refused as `too-long`, with the other reasons.
const HandleInput = t.String();

const HandleAvailability = t.Union([
  t.Object({ available: t.Literal(true), handle: t.String() }),
  t.Object({ available: t.Literal(false), reason: HandleUnavailable }),
]);

// In wpm: the median wpm of the User's last Duels, or the default Pace without any.
const PaceResponse = t.Object({ pace: t.Number() });

// Never the name nor the email of a User found: their Handle and their avatar.
const UsersFound = t.Array(
  t.Object({
    id: t.String(),
    handle: t.String(),
    image: t.Nullable(t.String()),
    relation: t.UnionEnum(RELATIONS),
  }),
);

// Order matters: headers and the request id are set before anything can throw, and
// the error handler is registered before the plugins that reject requests. The docs
// come after the security headers: they loosen the CSP on their own page. The prefix
// also applies to the routes of the plugins used here (the docs).
export const createApp = (config: AppConfig) => {
  // Throws the 429 once a User is over their searches.
  const limitSearches = keyedRateLimit(config.searchRateLimit);

  return (
    new Elysia({
      prefix: API_PREFIX,
      websocket: { maxPayloadLength: MAX_DUEL_MESSAGE_SIZE },
    })
      .use(requestId)
      .use(requestLogger(config.logger))
      .use(securityHeaders({ isProduction: config.isProduction }))
      .use(cors({ origin: config.corsOrigin, credentials: true }))
      .use(apiDocs({ enabled: !config.isProduction, auth: config.auth }))
      .use(errorHandler(config.logger))
      .use(bodyLimit)
      .use(rateLimit({ ...config.rateLimit, trustProxy: config.trustProxy }))
      .get("/health", () => ({ status: "ok" as const }), {
        response: t.Object({ status: t.Literal("ok") }),
        detail: { summary: "Health check", tags: ["System"] },
      })
      .use(authentication(config.auth, { trustProxy: config.trustProxy }))
      .get("/me", ({ user }) => meOf(user), {
        auth: true,
        response: MeResponse,
        detail: { summary: "The signed-in User", tags: ["Auth"] },
      })
      // Sets or changes the User's Handle: 422 with the reason in `details` when invalid, 409 when
      // another User holds it. The Session is cached again with the Handle.
      .put(
        "/me/handle",
        async ({ user, body, request, set }) => {
          await setHandle(config.users, user.id, body.handle);

          return meOf((await readSession(config.auth, request, set, { fresh: true })).user);
        },
        {
          auth: true,
          body: t.Object({ handle: HandleInput }),
          response: MeResponse,
          detail: { summary: "Sets the signed-in User's Handle", tags: ["Handle"] },
        },
      )
      // For the live check while the User types: valid, and free or already theirs.
      .get(
        "/handles/availability",
        ({ user, query }) => checkHandle(config.users, user.id, query.handle),
        {
          auth: true,
          query: t.Object({ handle: HandleInput }),
          response: HandleAvailability,
          detail: { summary: "Whether the signed-in User may take a Handle", tags: ["Handle"] },
        },
      )
      // The Pace of a solo Run: the one of the User's Duels.
      .get("/me/pace", async ({ user }) => ({ pace: await readPace(config.duelStore, user.id) }), {
        auth: true,
        response: PaceResponse,
        detail: {
          summary: "The signed-in User's Pace: the median wpm of their last Duels",
          tags: ["Duel"],
        },
      })
      // Updated as the User types: the Users whose Handle starts with `handle`, at most 10.
      .get(
        "/users/search",
        ({ user, query, set }) => {
          limitSearches(user.id, set);

          return searchUsers(
            config.users,
            { id: user.id, handle: user.handle ?? null },
            query.handle,
          );
        },
        {
          auth: true,
          query: t.Object({ handle: t.String({ minLength: HANDLE_SEARCH_MIN_LENGTH }) }),
          response: UsersFound,
          detail: { summary: "Finds Users by the start of their Handle", tags: ["Friends"] },
        },
      )
      .use(
        duelRoute({
          auth: config.auth,
          trustProxy: config.trustProxy,
          clock: config.clock,
          store: config.duelStore,
          users: config.users,
          logger: config.logger,
        }),
      )
  );
};

export type App = ReturnType<typeof createApp>;
