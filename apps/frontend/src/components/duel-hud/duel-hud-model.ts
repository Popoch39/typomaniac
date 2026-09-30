import type { Keystroke, RunState, ScoreState } from "typing-engine";

import type { KeystrokeCues } from "@/lib/cue-bus";
import { type DuelPlay, isChallenge } from "@/stores/duel-store";

// One player of a Duel as its HUD draws them: their Run and Score so far, the Keystrokes they come
// from, each stamped in ms since the start, the Cues of those that came in live, stamped in ms
// since the start too (when typed for this User, when received for the opponent), and whether
// their connection holds.
export type DuelHudPlayer = {
  run: RunState;
  score: ScoreState;
  keystrokes: readonly Keystroke[];
  cues: readonly KeystrokeCues[];
  connected: boolean;
};

// Everything the Duel's HUD draws, whoever feeds it: the Duel played in this tab, or a scripted
// one. Each player's Handle, this User's null while not read yet. `elapsed` is the Duel's clock,
// in ms since the start, negative during the Countdown; `startsAt` is the start on the injected
// clock, which the HUD's timelines are sought to on every tick. The HUD never tells the outcome:
// the Duel end does, once the server ends the Duel.
export type DuelHudModel = {
  self: DuelHudPlayer & { handle: string | null };
  opponent: DuelHudPlayer & { handle: string };
  challenge: boolean;
  seconds: number;
  startsAt: number;
  elapsed: number;
};

// The Duel's time is up on its clock.
export const isTimeUp = ({ elapsed, seconds }: DuelHudModel) => elapsed >= seconds * 1000;

// The Cues of each side's Keystrokes, as the bus handed them out.
export type DuelCues = {
  self: readonly KeystrokeCues[];
  opponent: readonly KeystrokeCues[];
};

// What the HUD of the Duel played in this tab draws besides the Duel: this User's Handle, the Cues
// of both sides and the Duel's clock.
type DuelHudInputs = {
  selfHandle: string | null;
  cues: DuelCues;
  elapsed: number;
};

// The HUD of the Duel played in this tab, `elapsed` ms into it.
export const duelHudModel = (
  duel: DuelPlay,
  { selfHandle, cues, elapsed }: DuelHudInputs,
): DuelHudModel => ({
  self: {
    handle: selfHandle,
    run: duel.run,
    score: duel.score,
    keystrokes: duel.keystrokes,
    cues: cues.self,
    connected: duel.connected,
  },
  opponent: {
    handle: duel.opponent.handle,
    run: duel.opponentRun,
    score: duel.opponentScore,
    keystrokes: duel.opponentKeystrokes,
    cues: cues.opponent,
    connected: duel.opponentConnected,
  },
  challenge: isChallenge(duel),
  seconds: duel.config.seconds,
  startsAt: duel.startsAt,
  elapsed,
});
