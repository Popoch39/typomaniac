import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/api/client";

const fetchUsersFound = async (handle: string) =>
  unwrap(await api.users.search.get({ query: { handle } }));

export type UserFound = Awaited<ReturnType<typeof fetchUsersFound>>[number];

// The Users whose Handle starts with `handle`: the exact one first, at most 10. Short-lived: Users
// choose and change their Handle at any time.
export const userSearchQueryOptions = (handle: string) =>
  queryOptions({
    queryKey: ["user-search", handle.toLowerCase()],
    queryFn: () => fetchUsersFound(handle),
    staleTime: 10_000,
  });
