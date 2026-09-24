import { type Keystroke, paceDuels, paceOf, type Result } from "typing-engine";

import type { Duel, DuelScore } from "./protocol";

// A player of a finished Duel: their Result, their Pace and Score and the Keystrokes the server
// accepted from them, which replay to both on the Duel's Text.
export type DuelPlayerRecord = {
  userId: string;
  result: Result;
  // The Pace their Bursts were judged against, frozen at the pairing, in wpm.
  pace: number;
  score: DuelScore;
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

// Where finished Duels are written, injected through AppConfig: Drizzle in production, in memory
// in the tests. A Duel still running when the API stops is never written.
export type DuelStore = {
  save: (record: DuelRecord) => Promise<void>;
  // The wpm of the last `count` Duels a User finished, the most recent first: those written before
  // the Score too.
  recentWpms: (userId: string, count: number) => Promise<number[]>;
};

// A User's Pace, from the wpm of their last Duels (the engine's paceOf).
export const readPace = async (store: DuelStore, userId: string) =>
  paceOf(await store.recentWpms(userId, paceDuels));
