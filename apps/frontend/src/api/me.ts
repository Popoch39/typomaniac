import { queryOptions } from "@tanstack/react-query";

import { api, unwrap, type TreatyResult } from "@/api/client";

// A 401 is the normal answer for a Visitor: no Session is not a failure.
export const toMe = <TData, TError>(result: TreatyResult<TData, TError>): TData | null => {
  if (result.error && result.status === 401) {
    return null;
  }

  return unwrap(result);
};

const fetchMe = async () => toMe(await api.me.get());

export type Me = NonNullable<Awaited<ReturnType<typeof fetchMe>>>;

// The Session only changes through a full-page OAuth round trip or a sign-out, which sets the cache itself.
export const meQueryOptions = queryOptions({
  queryKey: ["me"],
  queryFn: fetchMe,
  staleTime: Infinity,
});
