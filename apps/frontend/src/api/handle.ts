import { queryOptions } from "@tanstack/react-query";
import { HANDLE_REFUSALS, type HandleRefusal } from "handle";

import { api, ApiError, refusalAt, unwrap } from "@/api/client";
import type { Me } from "@/api/me";

// Why a Handle is refused: the shared rules, or held by another User (only the API knows).
export type HandleUnavailable = HandleRefusal | "taken";

const fetchAvailability = async (handle: string) =>
  unwrap(await api.handles.availability.get({ query: { handle } }));

export type HandleAvailability = Awaited<ReturnType<typeof fetchAvailability>>;

// Whether the signed-in User may take this Handle, already valid by the shared rules. Short-lived:
// someone else may take it at any time.
export const handleAvailabilityQueryOptions = (handle: string) =>
  queryOptions({
    queryKey: ["handle-availability", handle],
    queryFn: () => fetchAvailability(handle),
    staleTime: 5_000,
  });

const UNAVAILABLE = new Set<string>([...HANDLE_REFUSALS, "taken"]);

const isHandleUnavailable = (reason: string): reason is HandleUnavailable =>
  UNAVAILABLE.has(reason);

// The reason of a refused Handle, in the error's details (422 invalid, 409 taken); null for any
// other error.
const reasonOf = (error: ApiError) => {
  const reason = refusalAt(error, "/handle");

  return reason !== null && isHandleUnavailable(reason) ? reason : null;
};

export type SavedHandle = { ok: true; me: Me } | { ok: false; reason: HandleUnavailable | null };

// Sets or changes the User's Handle: the updated User, or why it was refused (null for a failure
// with no reason, a network error say).
export const saveHandle = async (handle: string): Promise<SavedHandle> => {
  const result = await api.me.handle.put({ handle });

  if (!result.error) {
    return { ok: true, me: result.data };
  }

  return { ok: false, reason: reasonOf(new ApiError(result.status, result.error.value)) };
};
