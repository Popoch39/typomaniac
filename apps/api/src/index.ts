import { createApp } from "./app";
import { runMigrations } from "./database/client";
import { env } from "./env";
import { createLogger } from "./logger";
import { HARD_REQUEST_BODY_SIZE } from "./plugins/body-limit";

const isProduction = env.NODE_ENV === "production";

const logger = createLogger({ level: env.LOG_LEVEL, pretty: !isProduction });

try {
  await runMigrations();
} catch (error) {
  logger.fatal({ err: error }, "migrations failed");
  process.exit(1);
}

const app = createApp({
  corsOrigin: env.CORS_ORIGIN,
  isProduction,
  trustProxy: env.TRUST_PROXY,
  rateLimit: { max: env.RATE_LIMIT_MAX, windowMs: env.RATE_LIMIT_WINDOW_MS },
  logger,
}).listen({ port: env.PORT, maxRequestBodySize: HARD_REQUEST_BODY_SIZE });

logger.info({ url: app.server?.url.href }, "server started");
