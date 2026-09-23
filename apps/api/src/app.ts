import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import type { Logger } from "pino";

import { errorHandler } from "./plugins/error-handler";
import { rateLimit } from "./plugins/rate-limit";
import { requestId } from "./plugins/request-id";
import { requestLogger } from "./plugins/request-logger";
import { securityHeaders } from "./plugins/security-headers";

export type AppConfig = {
  corsOrigin: string;
  isProduction: boolean;
  trustProxy: boolean;
  rateLimit: { max: number; windowMs: number };
  logger: Logger;
};

export const createApp = (config: AppConfig) =>
  new Elysia()
    .use(requestId)
    .use(requestLogger(config.logger))
    .use(securityHeaders({ isProduction: config.isProduction }))
    .use(cors({ origin: config.corsOrigin }))
    .use(errorHandler(config.logger))
    .use(rateLimit({ ...config.rateLimit, trustProxy: config.trustProxy }))
    .get("/health", () => ({ status: "ok" as const }));

export type App = ReturnType<typeof createApp>;
