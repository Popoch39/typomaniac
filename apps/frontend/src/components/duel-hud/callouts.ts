import { type Cue, maxMultiplier } from "typing-engine";

import { isKind } from "@/components/duel-hud/band-effects";
import { type Leader, leaderOf } from "@/components/duel-hud/band-lead";
import {
  type DuelHudModel,
  type DuelHudPlayer,
  isTimeUp,
} from "@/components/duel-hud/duel-hud-model";
import type { KeystrokeCues } from "@/lib/cue-bus";
import { atHandle } from "@/lib/at-handle";

// A new lead only counts as a Lead change once it has held this long, in ms: a lead that flickers
// for a few ms is none.
export const LEAD_HOLD_MS = 300;

// A Callout stays up this long at least, in ms, unless a more important one comes.
export const CALLOUT_MIN_MS = 500;

// How long each Callout lasts, in ms, as the board draws them.
const LEAD_CHANGE_MS = 1400;

const CUE_CALLOUT_MS = 1100;

// Whose colour a Callout is in: this User's accent, the opponent's blue, or the red of this User's
// broken Combo.
export type CalloutTone = "self" | "opponent" | "broken";

// What the HUD announces under the band, from `at` ms after GO, for `lasts` ms. The more
// `important`, the sooner it takes the place of another: 3 for a Lead change, 2 for what this
// User does, 1 for what the opponent does, drawn `small`. `value` follows `text` in figures,
// empty for a Lead change.
export type Callout = {
  at: number;
  lasts: number;
  important: 1 | 2 | 3;
  small: boolean;
  tone: CalloutTone;
  text: string;
  value: string;
};

// The points of the word a Keystroke validated, none if it validated none.
const pointsOf = ({ cues }: KeystrokeCues) => cues.find(isKind("word"))?.points ?? 0;

const words = (count: number) => `${count} ${count === 1 ? "mot" : "mots"}`;

// What one of this User's Keystrokes calls out with one of its Cues, null for nothing.
const ownCallout = (keystroke: KeystrokeCues, cue: Cue): Callout | null => {
  const own = { at: keystroke.at, lasts: CUE_CALLOUT_MS, important: 2, small: false } as const;

  switch (cue.kind) {
    case "burst":
      return { ...own, tone: "self", text: "BURST", value: `+${pointsOf(keystroke)}` };
    case "comboUp":
      return { ...own, tone: "self", text: "COMBO", value: `×${cue.multiplier}` };
    case "comboBroken":
      return { ...own, tone: "broken", text: "COMBO CASSÉ", value: words(cue.length) };
    default:
      return null;
  }
};

// What one of the opponent's Keystrokes calls out with one of its Cues, by their Handle, null for
// nothing: their Bursts, their broken Combos, and of their steps up only the last one, never the
// ×2 nor the ×3.
const opponentCallout =
  (handle: string) =>
  (keystroke: KeystrokeCues, cue: Cue): Callout | null => {
    const theirs = {
      at: keystroke.at,
      lasts: CUE_CALLOUT_MS,
      important: 1,
      small: true,
      tone: "opponent",
    } as const;

    switch (cue.kind) {
      case "burst":
        return { ...theirs, text: "BURST", value: `${handle} +${pointsOf(keystroke)}` };
      case "comboUp":
        return cue.multiplier === maxMultiplier
          ? { ...theirs, text: "COMBO", value: `${handle} ×${cue.multiplier}` }
          : null;
      case "comboBroken":
        return { ...theirs, text: "COMBO CASSÉ", value: handle };
      default:
        return null;
    }
  };

// The board calls out a Burst before the step up of the Combo its word brings.
const burstFirst = (a: Cue, b: Cue) => Number(b.kind === "burst") - Number(a.kind === "burst");

// What a player's Keystrokes call out, each one's Cues in the board's order.
const calloutsOf = (
  keystrokes: readonly KeystrokeCues[],
  callout: (keystroke: KeystrokeCues, cue: Cue) => Callout | null,
) =>
  keystrokes.flatMap((keystroke) =>
    keystroke.cues.toSorted(burstFirst).flatMap((cue) => callout(keystroke, cue) ?? []),
  );

// A player's Score before the first of their Keystrokes the HUD heard: the Score it left, less the
// points it brought; their Score now when none was heard (the Keystrokes a resume replays send
// none).
const startingScore = ({ cues, score }: DuelHudPlayer) => {
  const first = cues.at(0);

  return typeof first === "undefined" ? score.score : first.score - pointsOf(first);
};

// When someone took the lead from whoever had it last, as the HUD heard both players' Scores move:
// Keystrokes heard in the same ms count together, and equal Scores take no lead.
type Taking = { at: number; leader: Exclude<Leader, "none"> };

// Who led before the first Keystroke the HUD heard (no one at GO, whoever leads the Duel a resume
// comes back on), and each lead taken since.
type Takings = { from: Leader; takings: Taking[] };

const takingsOf = (self: DuelHudPlayer, opponent: DuelHudPlayer): Takings => {
  const heard = [
    ...self.cues.map(({ at, score }) => ({ at, self: score, opponent: null })),
    ...opponent.cues.map(({ at, score }) => ({ at, self: null, opponent: score })),
  ].toSorted((a, b) => a.at - b.at);

  const takings: Taking[] = [];
  let selfScore = startingScore(self);
  let opponentScore = startingScore(opponent);
  const from = leaderOf(selfScore - opponentScore);
  let leader = from;

  for (const [i, keystroke] of heard.entries()) {
    selfScore = keystroke.self ?? selfScore;
    opponentScore = keystroke.opponent ?? opponentScore;

    const leading = leaderOf(selfScore - opponentScore);

    if (heard[i + 1]?.at !== keystroke.at && leading !== "none" && leading !== leader) {
      takings.push({ at: keystroke.at, leader: leading });
      leader = leading;
    }
  }

  return { from, takings };
};

// The Lead changes up to `elapsed` ms after GO, each called out once its lead has held
// LEAD_HOLD_MS: a lead taken back before that changed nothing, and the first lead of the Duel is
// none.
const leadChanges = (
  self: DuelHudPlayer,
  opponent: DuelHudPlayer,
  elapsed: number,
  handle: string,
): Callout[] => {
  const { from, takings } = takingsOf(self, opponent);
  const changes: Callout[] = [];
  let leader = from;

  for (const [i, taking] of takings.entries()) {
    const held = (takings[i + 1]?.at ?? elapsed) - taking.at >= LEAD_HOLD_MS;

    if (held && taking.leader !== leader) {
      if (leader !== "none") {
        const ahead = taking.leader === "self";

        changes.push({
          at: taking.at + LEAD_HOLD_MS,
          lasts: LEAD_CHANGE_MS,
          important: 3,
          small: false,
          tone: ahead ? "self" : "opponent",
          text: ahead ? "TU PASSES DEVANT" : `${handle} PASSE DEVANT`,
          value: "",
        });
      }

      leader = taking.leader;
    }
  }

  return changes;
};

const byTimeThenImportance = (a: Callout, b: Callout) => a.at - b.at || b.important - a.important;

// The Callout the HUD shows `elapsed` ms into the Duel, null when none: one at a time, each for its
// whole length, unless another takes its place, at once when more important, once it has been up
// CALLOUT_MIN_MS otherwise. One that came too soon to take the place is never shown. None once the
// time is up.
export const calloutAt = (model: DuelHudModel): Callout | null => {
  if (isTimeUp(model)) {
    return null;
  }

  const { self, opponent, elapsed } = model;

  const handle = atHandle(opponent.handle);

  const candidates = [
    ...leadChanges(self, opponent, elapsed, handle),
    ...calloutsOf(self.cues, ownCallout),
    ...calloutsOf(opponent.cues, opponentCallout(handle)),
  ].toSorted(byTimeThenImportance);

  let shown: Callout | null = null;

  for (const callout of candidates) {
    if (callout.at > elapsed) {
      break;
    }

    if (
      shown === null ||
      callout.important > shown.important ||
      callout.at - shown.at >= CALLOUT_MIN_MS
    ) {
      shown = callout;
    }
  }

  return shown !== null && elapsed - shown.at < shown.lasts ? shown : null;
};
