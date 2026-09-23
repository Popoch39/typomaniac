import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import type { Logger } from "pino";

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
// the error handler is registered before the plugins that reject requests.
export const createApp = (config: AppConfig) =>
  new Elysia()
    .use(requestId)
    .use(requestLogger(config.logger))
    .use(securityHeaders({ isProduction: config.isProduction }))
    .use(cors({ origin: config.corsOrigin }))
    .use(errorHandler(config.logger))
    .use(bodyLimit)
    .use(rateLimit({ ...config.rateLimit, trustProxy: config.trustProxy }))
    .get("/health", () => ({ status: "ok" as const }));

export type App = ReturnType<typeof createApp>;
