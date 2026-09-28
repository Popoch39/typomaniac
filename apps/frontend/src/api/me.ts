import { queryOptions } from "@tanstack/react-query";

import { api, ApiError, type TreatyResult } from "@/api/client";

// UNAUTHORIZED is the normal answer for a Visitor: no Session is not a failure.
export const toMe = <TData, TError>(result: TreatyResult<TData, TError>): TData | null => {
  if (!result.error) {
    return result.data;
  }

  const error = new ApiError(result.status, result.error.value);

  if (error.code === "UNAUTHORIZED") {
    return null;
  }

  throw error;
};

const fetchMe = async () => toMe(await api.me.get());

export type Me = NonNullable<Awaited<ReturnType<typeof fetchMe>>>;

// The Session only changes through a full-page OAuth round trip, or a sign-out or dev email sign-in,
// which update the cache themselves. The rank changes at the end of a Ranked Duel (`LiveRank`).
export const meQueryOptions = queryOptions({
  queryKey: ["me"],
  queryFn: fetchMe,
  staleTime: Infinity,
});
