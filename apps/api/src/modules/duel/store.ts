import {
  type OrnamentChoice,
  ornamentOf,
  type Rank,
  type Rating,
  type Standing,
  type Tier,
} from "ranked";
import { type Keystroke, paceDuels, paceOf, type Result } from "typing-engine";

import type { Duel, DuelScore, Form } from "./model";

// A player of a finished Duel: their Result, their Pace and Score and the Keystrokes the server
// accepted from them, which replay to both on the Duel's Text.
export type DuelPlayerRecord = {
  userId: string;
  result: Result;
  // The Pace their Bursts were judged against, frozen at the pairing, in wpm.
  pace: number;
  // Null for the Duels written before the Score: their outcome is the one of the time, by wpm.
  score: DuelScore | null;
  keystrokes: readonly Keystroke[];
  // What a Duel of the Queue did to their Rating, written with the Duel; null for a Challenge.
  rated: RatedPlayer | null;
};

// A player's Rating before and after a ranked Duel, and the TP it moved (null in Placement).
export type RatedPlayer = { before: Rating; after: Rating; tp: number | null };

// How a finished Duel ended, for both players: someone won, a Draw, or the loser forfeited.
export const DUEL_OUTCOMES = ["win", "draw", "forfeit"] as const;

// A finished Duel as it is written: enough to replay it (Seed, Language, Word list version, Mode
// and the Keystrokes) and its outcome. `startsAt` and `endedAt` in ms since the epoch: the end of
// its time, or the moment of the Forfeit.
export type DuelRecord = Duel & {
  mode: "time";
  endedAt: number;
  outcome: (typeof DUEL_OUTCOMES)[number];
  // The winner's User id; null for a Draw.
  winnerId: string | null;
  players: readonly [DuelPlayerRecord, DuelPlayerRecord];
};

// Where a page of the Duel history starts: past the Duel that ended at `endedAt` with that id, the
// id telling apart the Duels that ended at the same instant.
export type DuelCursor = { endedAt: number; id: string };

// A player of a Duel as the Duel history shows them.
export type DuelHistoryPlayer = { userId: string; wpm: number; score: number | null };

// A finished Duel of the Duel history, seen from the User who reads it (`player`). `opponent` is
// null once their User is deleted: their player row goes with it.
export type DuelHistoryRow = {
  id: string;
  endedAt: number;
  outcome: DuelRecord["outcome"];
  winnerId: string | null;
  player: DuelHistoryPlayer;
  opponent: DuelHistoryPlayer | null;
  // The TP the Duel moved for the reader: null for a Challenge, in Placement and before the ranked.
  tp: number | null;
};

// A player of a finished Duel as it is read back: their Pace is null for the Duels written before
// it came from the history.
export type PlayedDuelPlayer = Omit<DuelPlayerRecord, "pace" | "rated"> & { pace: number | null };

// A finished Duel read back for one of its two Users (`player`), to replay it. `opponent` is null
// once their User is deleted: their player row goes with it.
export type PlayedDuel = Omit<DuelRecord, "players"> & {
  player: PlayedDuelPlayer;
  opponent: PlayedDuelPlayer | null;
};

// The aggregates of a User's finished Duels, seen from them: their record (a Forfeit is a loss for
// the one who did not win), their averages and their bests. The averages and the best wpm are null
// without a Duel; the best Score and Combo also without a Duel written since the Score.
export type DuelStats = {
  duels: number;
  record: { wins: number; losses: number; draws: number };
  averages: { wpm: number | null; accuracy: number | null };
  records: { wpm: number | null; score: number | null; combo: number | null };
};

// A point of the Progression: one finished Duel of a User, not a Forfeit.
export type ProgressionPoint = {
  endedAt: number;
  wpm: number;
  raw: number;
  accuracy: number;
  consistency: number;
};

// A finished Duel as the Activity shows it: its players still there (a deleted User's row goes
// with them) and their wpm.
export type RecentDuel = {
  id: string;
  endedAt: number;
  outcome: DuelRecord["outcome"];
  winnerId: string | null;
  players: { userId: string; wpm: number }[];
};

// A finished Ranked Duel as the Form reads it: how it ended and the reader's wpm.
export type RankedDuelRow = Pick<DuelRecord, "outcome" | "winnerId"> & { wpm: number };

// A User of the Classement: their place in it, from 1, and their rank, never their MMR.
export type LeaderboardRow = { userId: string; position: number; standing: Standing };

// A User with a Rating: their rank and the Ornament they chose, raw, to resolve by `ornamentOf`.
export type OrnamentChoiceRow = { userId: string; rank: Rank; choice: OrnamentChoice };

// Where finished Duels are written, injected through AppConfig: Drizzle in production, in memory
// in the tests. A Duel still running when the API stops is never written.
export type DuelStore = {
  // The Duel, and for a ranked one each player's new Rating, in one transaction.
  save: (record: DuelRecord) => Promise<void>;
  // The User's Rating, created as `initial` when they have none yet (their first join of the
  // Queue).
  ensureRating: (userId: string, initial: Rating) => Promise<Rating>;
  // The User's visible rank, never their MMR: null until they first join the Queue.
  rankOf: (userId: string) => Promise<Rank | null>;
  // The Ornament the User chose, raw: "follow" until they choose, or without a Rating.
  ornamentChoiceOf: (userId: string) => Promise<OrnamentChoice>;
  // The rank and raw Ornament choice of those of `userIds` who have a Rating, in one read: the
  // lists of Users never read them one by one.
  ornamentChoicesOf: (userIds: readonly string[]) => Promise<OrnamentChoiceRow[]>;
  // The first `limit` Users of the Classement, past Placement, in its order (`byStanding` of the
  // ranked package, ties by User id).
  leaderboard: (limit: number) => Promise<LeaderboardRow[]>;
  // Where the User stands in that same order, from 1: null in Placement or without a Rating.
  leaderboardPosition: (userId: string) => Promise<number | null>;
  // The wpm of the last `count` Duels a User finished, the most recent first: those written before
  // the Score too.
  recentWpms: (userId: string, count: number) => Promise<number[]>;
  // The last `count` Ranked Duels a User finished, the most recent first (by end, then by id):
  // neither the Challenges nor the Duels played before ranked existed.
  recentRankedDuels: (userId: string, count: number) => Promise<RankedDuelRow[]>;
  // A page of a User's Duel history: at most `limit` of their Duels, the most recent first (by end,
  // then by id), those before `before` when given.
  history: (
    userId: string,
    page: { before: DuelCursor | null; limit: number },
  ) => Promise<DuelHistoryRow[]>;
  // The Duel `duelId` as `userId` played it, whole: null when there is no such Duel or when that
  // User did not play it.
  playedDuel: (userId: string, duelId: string) => Promise<PlayedDuel | null>;
  // The Stats of a User's finished Duels, those whose opponent was deleted too.
  stats: (userId: string) => Promise<DuelStats>;
  // The Progression of a User: their last `limit` finished Duels but the Forfeits (all of them when
  // null), the oldest first.
  progression: (userId: string, limit: number | null) => Promise<ProgressionPoint[]>;
  // The last `limit` finished Duels played by any of `userIds`, each once, the most recent first
  // (by end, then by id).
  recentDuelsOf: (userIds: readonly string[], limit: number) => Promise<RecentDuel[]>;
};

// The outcome seen from `userId`: the winner won, the other lost, whether by Score or by Forfeit
// (the one who forfeited is the one who did not win).
export const outcomeFor = (
  userId: string,
  { outcome, winnerId }: Pick<DuelRecord, "outcome" | "winnerId">,
) => {
  if (outcome === "draw") {
    return "draw";
  }

  return winnerId === userId ? "win" : "loss";
};

// A User's Pace, from the wpm of their last Duels (the engine's paceOf).
export const readPace = async (store: DuelStore, userId: string) =>
  paceOf(await store.recentWpms(userId, paceDuels));

// A User's rank, never their MMR, and the Ornament they wear, resolved from their choice: never
// the raw choice, which is theirs alone. Both null until they first join the Queue.
export const readRankAndOrnament = async (store: DuelStore, userId: string) => {
  const [rank, choice] = await Promise.all([store.rankOf(userId), store.ornamentChoiceOf(userId)]);

  return { rank, ornament: rank === null ? null : ornamentOf(rank, choice) };
};

// The Ornament each of `userIds` wears, resolved from their choice, in one read of the Ratings:
// absent for those who wear none (in Placement, without a Rating or by choice).
export const readOrnaments = async (
  store: DuelStore,
  userIds: readonly string[],
): Promise<ReadonlyMap<string, Tier>> => {
  if (userIds.length === 0) {
    return new Map();
  }

  const rows = await store.ornamentChoicesOf(userIds);

  return new Map(
    rows.flatMap(({ userId, rank, choice }) => {
      const ornament = ornamentOf(rank, choice);

      return ornament === null ? [] : [[userId, ornament] as const];
    }),
  );
};

// How many Ranked Duels the Form shows.
export const FORM_DUELS = 5;

// A User's Form, from their last Ranked Duels: null without one.
export const readForm = async (store: DuelStore, userId: string): Promise<Form | null> => {
  const duels = await store.recentRankedDuels(userId, FORM_DUELS);

  if (duels.length === 0) {
    return null;
  }

  return {
    avgWpm: duels.reduce((sum, { wpm }) => sum + wpm, 0) / duels.length,
    outcomes: duels.map((duel) => outcomeFor(userId, duel)),
  };
};
