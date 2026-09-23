import { Elysia } from "elysia";
import type { Logger } from "pino";

import { requestIdOf } from "./request-id";

// Unexpected errors: Elysia would echo error.message to the client, which can leak
// internals. The client gets a generic body plus the request id to quote in a bug
// report; the details only go to the logs. Client errors (404, validation, parse)
// keep Elysia's default answer.
export const errorHandler = (logger: Logger) =>
  new Elysia({ name: "error-handler", seed: logger })
    .onError(({ code, error, request, status }) => {
      if (code !== "UNKNOWN" && code !== "INTERNAL_SERVER_ERROR") {
        return;
      }

      const requestId = requestIdOf(request);

      logger.error({ err: error, requestId }, "unhandled error");

      return status(500, { error: "Internal Server Error", requestId });
    })
    .as("global");
