import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import type { Logger } from "pino";

import { API_PREFIX } from "./lib/api-prefix";
import type { Clock } from "./lib/clock";
import { type AuthHandler, authentication } from "./modules/auth";
import { duelModule } from "./modules/duel";
import { MAX_DUEL_MESSAGE_SIZE } from "./modules/duel/model";
import type { DuelStore } from "./modules/duel/store";
import { handleModule } from "./modules/handle";
import { meModule } from "./modules/me";
import { userModule } from "./modules/user";
import type { Users } from "./modules/user/users";
import { apiDocs } from "./plugins/api-docs";
import { bodyLimit } from "./plugins/body-limit";
import { errorHandler } from "./plugins/error-handler";
import { type RateLimit, rateLimit } from "./plugins/rate-limit";
import { requestId } from "./plugins/request-id";
import { requestLogger } from "./plugins/request-logger";
import { securityHeaders } from "./plugins/security-headers";

export type { ApiErrorBody, ErrorCode, ErrorDetail } from "./lib/errors";

export type { ClientMessage, ServerMessage } from "./modules/duel/model";

export type AppConfig = {
  corsOrigin: string;
  isProduction: boolean;
  trustProxy: boolean;
  rateLimit: { max: number; windowMs: number };
  logger: Logger;
  // Built by the entry point (src/modules/auth/service.ts) from the env, like the logger.
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

// Order matters: headers and the request id are set before anything can throw, and
// the error handler is registered before the plugins that reject requests. The docs
// come after the security headers: they loosen the CSP on their own page. The prefix
// also applies to the routes of the plugins used here (the docs). The feature modules
// come last, each one from src/modules/.
export const createApp = (config: AppConfig) => {
  const { auth, trustProxy, users, duelStore } = config;

  return new Elysia({
    prefix: API_PREFIX,
    websocket: { maxPayloadLength: MAX_DUEL_MESSAGE_SIZE },
  })
    .use(requestId)
    .use(requestLogger(config.logger))
    .use(securityHeaders({ isProduction: config.isProduction }))
    .use(cors({ origin: config.corsOrigin, credentials: true }))
    .use(apiDocs({ enabled: !config.isProduction, auth }))
    .use(errorHandler(config.logger))
    .use(bodyLimit)
    .use(rateLimit({ ...config.rateLimit, trustProxy }))
    .get("/health", () => ({ status: "ok" as const }), {
      response: t.Object({ status: t.Literal("ok") }),
      detail: { summary: "Health check", tags: ["System"] },
    })
    .use(authentication(auth, { trustProxy }))
    .use(meModule({ auth, trustProxy, duelStore }))
    .use(handleModule({ auth, trustProxy, users }))
    .use(userModule({ auth, trustProxy, users, searchRateLimit: config.searchRateLimit }))
    .use(
      duelModule({
        auth,
        trustProxy,
        clock: config.clock,
        store: duelStore,
        users,
        logger: config.logger,
      }),
    );
};

export type App = ReturnType<typeof createApp>;
