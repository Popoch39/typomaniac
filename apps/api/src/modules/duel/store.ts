import { type Keystroke, paceDuels, paceOf, type Result } from "typing-engine";

import type { Duel, DuelScore } from "./model";

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
};

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
};

// A player of a finished Duel as it is read back: their Pace is null for the Duels written before
// it came from the history.
export type PlayedDuelPlayer = Omit<DuelPlayerRecord, "pace"> & { pace: number | null };

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

// Where finished Duels are written, injected through AppConfig: Drizzle in production, in memory
// in the tests. A Duel still running when the API stops is never written.
export type DuelStore = {
  save: (record: DuelRecord) => Promise<void>;
  // The wpm of the last `count` Duels a User finished, the most recent first: those written before
  // the Score too.
  recentWpms: (userId: string, count: number) => Promise<number[]>;
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
};

// A User's Pace, from the wpm of their last Duels (the engine's paceOf).
export const readPace = async (store: DuelStore, userId: string) =>
  paceOf(await store.recentWpms(userId, paceDuels));
