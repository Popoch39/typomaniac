import type { Keystroke, Result } from "typing-engine";

import type { Duel } from "./protocol";

// A player of a finished Duel: their Result and the Keystrokes the server accepted from them,
// which replay to that Result on the Duel's Text.
export type DuelPlayerRecord = { userId: string; result: Result; keystrokes: readonly Keystroke[] };

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
export type DuelStore = { save: (record: DuelRecord) => Promise<void> };
