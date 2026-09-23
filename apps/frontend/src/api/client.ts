import { treaty } from "@elysia/eden";
import type { App } from "api";

import { env } from "@/env";

// Every API route lives under /api: the tree starts there, calls read `api.health.get()`.
export const api = treaty<App>(env.VITE_API_URL).api;

export class ApiError<TValue> extends Error {
  readonly status: number;

  readonly value: TValue;

  constructor(status: number, value: TValue) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.value = value;
  }
}

type TreatyResult<TData, TError> =
  | { data: TData; error: null; status: number }
  | { data: null; error: { value: TError }; status: number };

// Eden resolves HTTP errors instead of rejecting: throw them so Query and the router's errorComponent see them.
export const unwrap = <TData, TError>(result: TreatyResult<TData, TError>): TData => {
  if (result.error) {
    throw new ApiError(result.status, result.error.value);
  }

  return result.data;
};
