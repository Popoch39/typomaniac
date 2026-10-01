import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/api/client";

// A stretch `[from, to)` of the User's History, in ms since the epoch.
export type HistoryRange = { from: number; to: number };

const fetchHistoryWeek = async (query: HistoryRange) => unwrap(await api.duels.get({ query }));

export type HistoryWeek = Awaited<ReturnType<typeof fetchHistoryWeek>>;

export type DuelHistoryEntry = HistoryWeek["duels"][number];

// Every key of the History starts so.
const HISTORY_QUERY_KEY = ["history"];

// The signed-in User's Duels of a week, the most recent first, each with both sides' wpm line.
export const historyWeekQueryOptions = (range: HistoryRange) =>
  queryOptions({
    queryKey: [...HISTORY_QUERY_KEY, "week", range.from, range.to],
    queryFn: () => fetchHistoryWeek(range),
  });

type ActivityQuery = HistoryRange & { timeZone: string };

const fetchHistoryActivity = async (query: ActivityQuery) =>
  unwrap(await api.duels.activity.get({ query }));

export type HistoryActivity = Awaited<ReturnType<typeof fetchHistoryActivity>>;

// How many Duels the User finished on each day of the browser's time zone in the range, and when
// they finished their first.
export const historyActivityQueryOptions = (range: HistoryRange) => {
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions();

  return queryOptions({
    queryKey: [...HISTORY_QUERY_KEY, "activity", range.from, range.to, timeZone],
    queryFn: () => fetchHistoryActivity({ ...range, timeZone }),
  });
};

const fetchReplayedDuel = async (duelId: string) => unwrap(await api.duels({ duelId }).get());

// A finished Duel of the User, whole, seen from them: its Text, both sides and their Keystrokes.
export type ReplayedDuel = Awaited<ReturnType<typeof fetchReplayedDuel>>;

export type ReplayedPlayer = ReplayedDuel["me"];

export const replayedDuelQueryOptions = (duelId: string) =>
  queryOptions({
    // Apart from the History's keys: invalidating them leaves the Replays be.
    queryKey: ["duel", duelId],
    queryFn: () => fetchReplayedDuel(duelId),
  });
