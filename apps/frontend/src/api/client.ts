import { treaty } from "@elysia/eden";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import type { App } from "api";
import { ERRORS, type ErrorCode, type ErrorDetail } from "api/errors";

import { fetchWithEarlyMe } from "@/api/early-me";
import { env } from "@/env";

// Every API route lives under /api: the tree starts there, calls read `api.health.get()`.
// The API is on another origin in dev: without credentials the Session cookie is never sent.
// The first `me` takes the answer index.html asked for as the page opened (`fetchWithEarlyMe`).
export const api = treaty<App>(env.VITE_API_URL, {
  fetch: { credentials: "include" },
  fetcher: fetchWithEarlyMe,
}).api;

// The API's error format, `ApiErrorBody` of apps/api/src/lib/errors.ts, checked at the boundary.
const ErrorBody = Type.Object({
  error: Type.Object({
    code: Type.String(),
    message: Type.String(),
    requestId: Type.String(),
    details: Type.Optional(
      Type.Array(Type.Object({ path: Type.String(), message: Type.String() })),
    ),
  }),
});

const isErrorCode = (code: string): code is ErrorCode => Object.hasOwn(ERRORS, code);

// A failed API call, read from its body. A body not in the API's format (a proxy's error page, say)
// leaves `code` and `requestId` null, a code unknown to ERRORS leaves `code` null: branch on `code`,
// never on the HTTP status.
export class ApiError extends Error {
  readonly status: number;

  readonly code: ErrorCode | null;

  readonly requestId: string | null;

  readonly details: ErrorDetail[];

  constructor(status: number, body: Parameters<typeof Value.Check>[1]) {
    const error = Value.Check(ErrorBody, body) ? body.error : null;
    const code = error !== null && isErrorCode(error.code) ? error.code : null;

    super(error?.message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = error?.requestId ?? null;
    this.details = error?.details ?? [];
  }
}

export type TreatyResult<TData, TError> =
  | { data: TData; error: null; status: number }
  | { data: null; error: { value: TError }; status: number };

// Eden resolves HTTP errors instead of rejecting: throw them so Query and the router's errorComponent see them.
export const unwrap = <TData, TError>(result: TreatyResult<TData, TError>): TData => {
  if (result.error) {
    throw new ApiError(result.status, result.error.value);
  }

  return result.data;
};

// The rule a refused action broke, as the API names it in the detail on `path` (`/handle`,
// `/userId`…); null for any other error.
export const refusalAt = (error: ApiError, path: string) =>
  error.details.find((detail) => detail.path === path)?.message ?? null;
