import {
  Elysia,
  ElysiaCustomStatusResponse,
  InvalidCookieSignature,
  InvalidFileType,
  NotFoundError,
  ParseError,
  ValidationError,
} from "elysia";
import type { Logger } from "pino";

import { ApiError, type ApiErrorBody, codeForStatus } from "../lib/errors";
import { requestIdOf } from "./request-id";

// Elysia's own errors, translated into the API vocabulary. Anything unrecognised is a
// bug: a generic 500, never its message (it can leak internals).
const toApiError = (
  error: Readonly<Error> | Readonly<ElysiaCustomStatusResponse<number, number, number>>,
) => {
  if (error instanceof ApiError) {
    return error;
  }

  // `throw status(409, …)`: the status is kept, the free-form payload is not.
  if (error instanceof ElysiaCustomStatusResponse) {
    return new ApiError(codeForStatus(error.code));
  }

  if (error instanceof NotFoundError) {
    return new ApiError("NOT_FOUND");
  }

  if (error instanceof ParseError || error instanceof InvalidCookieSignature) {
    return new ApiError("BAD_REQUEST");
  }

  if (error instanceof InvalidFileType) {
    return new ApiError("VALIDATION_FAILED", undefined, [
      { path: `/${error.property}`, message: error.message },
    ]);
  }

  // A response that fails its own schema is the server's fault, not the client's.
  if (error instanceof ValidationError && error.type !== "response") {
    return new ApiError(
      "VALIDATION_FAILED",
      undefined,
      error.all.map(({ path, message }) => ({ path, message })),
    );
  }

  return new ApiError("INTERNAL_SERVER_ERROR");
};

// Every error leaves the API as ApiErrorBody (see src/lib/errors.ts). Server errors are
// logged with their stack and the request id the client receives.
export const errorHandler = (logger: Logger) =>
  new Elysia({ name: "error-handler", seed: logger })
    .onError(({ error, request, status }) => {
      const requestId = requestIdOf(request);

      const apiError = toApiError(error);

      if (apiError.status >= 500) {
        logger.error({ err: error, requestId }, "unhandled error");
      }

      const body: ApiErrorBody = {
        error: {
          code: apiError.code,
          message: apiError.message,
          requestId,
          ...(apiError.details && { details: apiError.details }),
        },
      };

      return status(apiError.status, body);
    })
    .as("global");
