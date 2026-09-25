import {
  computeScore,
  defaultPace,
  keystrokesUpTo,
  type RunConfig,
  runAt,
  type RunState,
  type ScoreState,
} from "typing-engine";

import type { ReplayedDuel, ReplayedPlayer } from "@/api/duel-history";
import type { RunTone } from "@/components/run/run-tone";

// The Duel's Text as it was drawn: its Seed, Language and Word list version, even an old one. A
// Duel is always played in `time` Mode.
export const replayConfig = (duel: ReplayedDuel): RunConfig => ({
  mode: "time",
  seconds: duel.seconds,
  language: duel.language,
  wordListVersion: duel.wordListVersion,
  seed: duel.seed,
});

// How long the Replay lasts, in ms: the Duel's time, or up to the Forfeit when it came first.
export const replayDuration = (duel: ReplayedDuel) =>
  Math.max(0, Math.min(duel.seconds * 1000, duel.endedAt - duel.startsAt));

// A side of the Duel at an instant of its Replay: their Run, and their Score (null for a Duel played
// before the Score).
export type ReplaySide = { run: RunState; score: ScoreState | null };

// A side at `t` ms into the Duel. Their Score goes at the Pace it was judged against; the Duels
// written before the Pace came from the history go at the default one.
const sideAt = (config: RunConfig, player: ReplayedPlayer, t: number): ReplaySide => ({
  run: runAt(config, player.keystrokes, t),
  score:
    player.score === null
      ? null
      : computeScore(config, keystrokesUpTo(player.keystrokes, t), player.pace ?? defaultPace, t),
});

// Both sides at `t`; no opponent once their User is deleted.
export const sidesAt = (duel: ReplayedDuel, t: number) => {
  const config = replayConfig(duel);

  return {
    own: sideAt(config, duel.me, t),
    opponent: duel.opponent ? sideAt(config, duel.opponent, t) : null,
  };
};

// Whose Run the Replay shows: the User's, with their opponent's caret, or the other way round.
export type ReplayView = DuelSide;

// A side of the Duel: the User's own, or their opponent's.
export type DuelSide = RunTone;

// Who forfeited, the side that did not win, and when: the recorded end minus the start, where the
// Replay ends (`replayDuration`), so no Run goes on past it. Null for a Duel ended by its time.
export const replayForfeit = (duel: ReplayedDuel): { side: DuelSide; at: number } | null => {
  if (!duel.forfeit) {
    return null;
  }

  return { side: duel.outcome === "win" ? "opponent" : "own", at: replayDuration(duel) };
};

// The side whose Run shows, which one it is, and the one whose caret stands in it. Without an
// opponent, the User's.
export const viewedSides = (
  { own, opponent }: { own: ReplaySide; opponent: ReplaySide | null },
  view: ReplayView,
): { shown: ReplaySide; shownSide: DuelSide; caretSide: ReplaySide | null } =>
  view === "opponent" && opponent !== null
    ? { shown: opponent, shownSide: "opponent", caretSide: own }
    : { shown: own, shownSide: "own", caretSide: opponent };
