import type { Keystroke, RunState, ScoreState } from "typing-engine";

import { type DuelEnding, type DuelPlay, isChallenge } from "@/stores/duel-store";

// One player of a Duel as its HUD draws them: their Run and Score so far, the Keystrokes they come
// from, each stamped in ms since the start, and whether their connection holds.
export type DuelHudPlayer = {
  run: RunState;
  score: ScoreState;
  keystrokes: readonly Keystroke[];
  connected: boolean;
};

// Everything the Duel's HUD draws, whoever feeds it: the Duel played in this tab, or a scripted
// one. Each player's Handle, this User's null while not read yet. `elapsed` is the Duel's clock,
// in ms since the start, negative during the Countdown; `outcome` is null until the server ends
// the Duel.
export type DuelHudModel = {
  self: DuelHudPlayer & { handle: string | null };
  opponent: DuelHudPlayer & { handle: string };
  challenge: boolean;
  seconds: number;
  elapsed: number;
  outcome: DuelEnding["outcome"] | null;
};

// The HUD of the Duel played in this tab, `elapsed` ms into it: still in play, so without an
// outcome.
export const duelHudModel = (
  duel: DuelPlay,
  selfHandle: string | null,
  elapsed: number,
): DuelHudModel => ({
  self: {
    handle: selfHandle,
    run: duel.run,
    score: duel.score,
    keystrokes: duel.keystrokes,
    connected: duel.connected,
  },
  opponent: {
    handle: duel.opponent.handle,
    run: duel.opponentRun,
    score: duel.opponentScore,
    keystrokes: duel.opponentKeystrokes,
    connected: duel.opponentConnected,
  },
  challenge: isChallenge(duel),
  seconds: duel.config.seconds,
  elapsed,
  outcome: null,
});
