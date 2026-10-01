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

const fetchWrittenDuel = async (duelId: string) => unwrap(await api.duels({ duelId }).get());

// A finished Duel of the User, whole, seen from them: both Users and each of its Rounds, with their
// Text and both sides' Keystrokes.
export type WrittenDuel = Awaited<ReturnType<typeof fetchWrittenDuel>>;

type WrittenPlayer = NonNullable<WrittenDuel["opponent"]>;

type WrittenRound = WrittenDuel["rounds"][number];

type WrittenRoundSide = WrittenRound["me"];

// One User of a Duel seen on one of its Rounds: who they are and their Pace, with the Result,
// Score and Keystrokes of that Round.
export type ReplayedPlayer = Omit<WrittenPlayer, "result" | "roundsWon"> & WrittenRoundSide;

// A finished Duel seen on one of its Rounds: its Text (Seed) and time are the Round's, both sides
// are what the Users did in it.
export type ReplayedDuel = Omit<WrittenDuel, "me" | "opponent" | "rounds" | "roundsToWin"> &
  Pick<WrittenRound, "seed" | "startsAt" | "endedAt"> & {
    me: ReplayedPlayer;
    opponent: ReplayedPlayer | null;
  };

const playerOnRound = (
  { handle, image, pace }: WrittenPlayer,
  side: WrittenRoundSide,
): ReplayedPlayer => ({ handle, image, pace, ...side });

// `duel` seen on its Round `round`.
export const duelOnRound = (duel: WrittenDuel, round: WrittenRound): ReplayedDuel => {
  const { me, opponent, rounds: _, roundsToWin: __, ...rest } = duel;

  return {
    ...rest,
    seed: round.seed,
    startsAt: round.startsAt,
    endedAt: round.endedAt,
    me: playerOnRound(me, round.me),
    opponent: opponent && round.opponent ? playerOnRound(opponent, round.opponent) : null,
  };
};

// The Duel seen on its first Round: the only one a Duel has before the Bo3.
const onFirstRound = (duel: WrittenDuel): ReplayedDuel => {
  const [first] = duel.rounds;

  // The API never sends a Duel without a Round (`minItems: 1`).
  if (typeof first === "undefined") {
    throw new Error(`Duel ${duel.id} without a Round`);
  }

  return duelOnRound(duel, first);
};

export const replayedDuelQueryOptions = (duelId: string) =>
  queryOptions({
    // Apart from the History's keys: invalidating them leaves the Replays be.
    queryKey: ["duel", duelId],
    queryFn: () => fetchWrittenDuel(duelId),
    select: onFirstRound,
  });
