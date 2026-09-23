import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import type { Logger } from "pino";

import { API_PREFIX } from "./api-prefix";
import { apiDocs } from "./plugins/api-docs";
import { bodyLimit } from "./plugins/body-limit";
import { errorHandler } from "./plugins/error-handler";
import { rateLimit } from "./plugins/rate-limit";
import { requestId } from "./plugins/request-id";
import { requestLogger } from "./plugins/request-logger";
import { securityHeaders } from "./plugins/security-headers";

export type { ApiErrorBody, ErrorCode, ErrorDetail } from "./errors";

export type AppConfig = {
  corsOrigin: string;
  isProduction: boolean;
  trustProxy: boolean;
  rateLimit: { max: number; windowMs: number };
  logger: Logger;
};

// Order matters: headers and the request id are set before anything can throw, and
// the error handler is registered before the plugins that reject requests. The docs
// come after the security headers: they loosen the CSP on their own page. The prefix
// also applies to the routes of the plugins used here (the docs).
export const createApp = (config: AppConfig) =>
  new Elysia({ prefix: API_PREFIX })
    .use(requestId)
    .use(requestLogger(config.logger))
    .use(securityHeaders({ isProduction: config.isProduction }))
    .use(cors({ origin: config.corsOrigin }))
    .use(apiDocs({ enabled: !config.isProduction }))
    .use(errorHandler(config.logger))
    .use(bodyLimit)
    .use(rateLimit({ ...config.rateLimit, trustProxy: config.trustProxy }))
    .get("/health", () => ({ status: "ok" as const }), {
      response: t.Object({ status: t.Literal("ok") }),
      detail: { summary: "Health check", tags: ["System"] },
    });

export type App = ReturnType<typeof createApp>;
