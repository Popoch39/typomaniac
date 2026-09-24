import { type InfiniteData, infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

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

const fetchReplayedDuel = async (duelId: string) => unwrap(await api.duels({ duelId }).get());

// A finished Duel of the User, whole, seen from them: its Text, both sides and their Keystrokes.
export type ReplayedDuel = Awaited<ReturnType<typeof fetchReplayedDuel>>;

export type ReplayedPlayer = ReplayedDuel["me"];

export const replayedDuelQueryOptions = (duelId: string) =>
  queryOptions({
    // Apart from the Duel history's key: invalidating it leaves the Replays be.
    queryKey: ["duel", duelId],
    queryFn: () => fetchReplayedDuel(duelId),
  });
