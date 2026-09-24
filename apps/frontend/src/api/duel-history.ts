import { type InfiniteData, infiniteQueryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/api/client";

// Null for the first page, then the `next` of the page before.
type Cursor = string | null;

const fetchDuelHistoryPage = async (before: Cursor) =>
  unwrap(await api.duels.get({ query: before === null ? {} : { before } }));

export type DuelHistoryPage = Awaited<ReturnType<typeof fetchDuelHistoryPage>>;

export type DuelHistoryEntry = DuelHistoryPage["duels"][number];

// The signed-in User's finished Duels, the most recent first, a page at a time.
export const duelHistoryQueryOptions = infiniteQueryOptions<
  DuelHistoryPage,
  Error,
  InfiniteData<DuelHistoryPage, Cursor>,
  string[],
  Cursor
>({
  queryKey: ["duels"],
  queryFn: ({ pageParam }) => fetchDuelHistoryPage(pageParam),
  initialPageParam: null,
  getNextPageParam: (page) => page.next,
});
