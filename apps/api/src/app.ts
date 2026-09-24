import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import type { Logger } from "pino";

import { API_PREFIX } from "./api-prefix";
import type { Clock } from "./clock";
import { duelRoute } from "./duel/duel-route";
import { MAX_DUEL_MESSAGE_SIZE } from "./duel/protocol";
import { apiDocs } from "./plugins/api-docs";
import { type AuthHandler, authentication } from "./plugins/authentication";
import { bodyLimit } from "./plugins/body-limit";
import { errorHandler } from "./plugins/error-handler";
import { rateLimit } from "./plugins/rate-limit";
import { requestId } from "./plugins/request-id";
import { requestLogger } from "./plugins/request-logger";
import { securityHeaders } from "./plugins/security-headers";

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
  // The Duel's time source (Countdown, server time sent to the clients).
  clock: Clock;
};

const MeResponse = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
  image: t.Nullable(t.String()),
});

// Order matters: headers and the request id are set before anything can throw, and
// the error handler is registered before the plugins that reject requests. The docs
// come after the security headers: they loosen the CSP on their own page. The prefix
// also applies to the routes of the plugins used here (the docs).
export const createApp = (config: AppConfig) =>
  new Elysia({ prefix: API_PREFIX, websocket: { maxPayloadLength: MAX_DUEL_MESSAGE_SIZE } })
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
    .get(
      "/me",
      ({ user }) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? null,
      }),
      {
        auth: true,
        response: MeResponse,
        detail: { summary: "The signed-in User", tags: ["Auth"] },
      },
    )
    .use(duelRoute({ auth: config.auth, trustProxy: config.trustProxy, clock: config.clock }));

export type App = ReturnType<typeof createApp>;
