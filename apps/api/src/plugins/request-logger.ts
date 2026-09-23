import { Elysia } from "elysia";
import type { Logger } from "pino";

import { requestIdOf } from "./request-id";

const startedAt = new WeakMap<Request, number>();

// One line per request once the response is sent, errors included. Handlers get
// `log`, a child logger already tagged with the request id.
export const requestLogger = (logger: Logger) =>
  new Elysia({ name: "request-logger", seed: logger })
    .onRequest(({ request }) => {
      startedAt.set(request, performance.now());
    })
    .derive(({ request }) => ({ log: logger.child({ requestId: requestIdOf(request) }) }))
    .onAfterResponse(({ request, path, set, responseValue }) => {
      const start = startedAt.get(request) ?? performance.now();

      logger.info(
        {
          requestId: requestIdOf(request),
          method: request.method,
          path,
          // A Response returned as-is (e.g. the rate limiter's 429) carries its own status.
          status: responseValue instanceof Response ? responseValue.status : (set.status ?? 200),
          durationMs: Math.round((performance.now() - start) * 100) / 100,
        },
        "request",
      );
    })
    .as("global");
