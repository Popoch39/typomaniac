import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { queryOptions } from "@tanstack/react-query";
import { HANDLE_REFUSALS, type HandleRefusal } from "handle";

import { api, unwrap } from "@/api/client";
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

// A refused Handle: the API puts the reason in the error's details (422 invalid, 409 taken). Read
// here rather than through `unwrap`, whose ApiError keeps the body opaque.
const HandleRefused = Type.Object({
  error: Type.Object({
    details: Type.Tuple([
      Type.Object({
        path: Type.Literal("/handle"),
        message: Type.String(),
      }),
    ]),
  }),
});

const UNAVAILABLE = new Set<string>([...HANDLE_REFUSALS, "taken"]);

const isHandleUnavailable = (reason: string): reason is HandleUnavailable =>
  UNAVAILABLE.has(reason);

// The reason of a refused Handle, null for any other error.
const reasonOf = (error: Parameters<typeof Value.Check>[1]) => {
  if (!Value.Check(HandleRefused, error)) {
    return null;
  }

  const reason = error.error.details[0].message;

  return isHandleUnavailable(reason) ? reason : null;
};

export type SavedHandle = { ok: true; me: Me } | { ok: false; reason: HandleUnavailable | null };

// Sets or changes the User's Handle: the updated User, or why it was refused (null for a failure
// with no reason, a network error say).
export const saveHandle = async (handle: string): Promise<SavedHandle> => {
  const result = await api.me.handle.put({ handle });

  if (!result.error) {
    return { ok: true, me: result.data };
  }

  return { ok: false, reason: reasonOf(result.error.value) };
};
