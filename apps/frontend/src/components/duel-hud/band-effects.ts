import type { Cue } from "typing-engine";

import type { KeystrokeCues } from "@/lib/cue-bus";

// How long each effect of a Cue plays in the band, in ms, as the board draws them.
export const POP_MS = 800;

export const PIP_PUNCH_MS = 320;

export const MULTIPLIER_PUNCH_MS = 700;

export const BROKEN_MS = 700;

type CueOf<K extends Cue["kind"]> = Extract<Cue, { kind: K }>;

const isKind =
  <K extends Cue["kind"]>(kind: K) =>
  (cue: Cue): cue is CueOf<K> =>
    cue.kind === kind;

const isRightWord = (cue: CueOf<"word">) => cue.correct;

// The player's last Cue of `kind` (among those `keep` keeps) and its Keystroke, as long as its
// effect, lasting `lasts` ms, still plays `elapsed` ms into the Duel; null otherwise.
const lastLive = <K extends Cue["kind"]>(
  keystrokes: readonly KeystrokeCues[],
  kind: K,
  lasts: number,
  elapsed: number,
  keep: (cue: CueOf<K>) => boolean = () => true,
) => {
  for (const keystroke of keystrokes.toReversed()) {
    const cue = keystroke.cues.filter(isKind(kind)).find(keep);

    if (typeof cue !== "undefined") {
      return elapsed - keystroke.at < lasts ? { keystroke, cue } : null;
    }
  }

  return null;
};

// The « +N » of a right word: its points, bigger for a Burst, from its Keystroke on.
export type ScorePop = { at: number; points: number; burst: boolean };

// What plays in one player's half of the band `elapsed` ms into the Duel, each effect from its
// Keystroke on (null when none plays): the « +N » of their last right word, the punch of the pip
// it lit and of their multiplier going up a step, and the red of a broken Combo. Once the time is
// up, only the multiplier still punches, as on the board.
export type BandEffects = {
  pop: ScorePop | null;
  pipPunch: number | null;
  multiplierPunch: number | null;
  broken: number | null;
};

export const bandEffects = (
  keystrokes: readonly KeystrokeCues[],
  elapsed: number,
  ended: boolean,
): BandEffects => {
  const multiplierPunch =
    lastLive(keystrokes, "comboUp", MULTIPLIER_PUNCH_MS, elapsed)?.keystroke.at ?? null;

  if (ended) {
    return { pop: null, pipPunch: null, multiplierPunch, broken: null };
  }

  const broken = lastLive(keystrokes, "comboBroken", BROKEN_MS, elapsed)?.keystroke.at ?? null;
  // The « +N » lasts longer than the punch of the pip its word lit.
  const word = lastLive(keystrokes, "word", POP_MS, elapsed, isRightWord);

  if (word === null) {
    return { pop: null, pipPunch: null, multiplierPunch, broken };
  }

  const { at } = word.keystroke;

  return {
    pop: { at, points: word.cue.points, burst: word.keystroke.cues.some(isKind("burst")) },
    pipPunch: elapsed - at < PIP_PUNCH_MS ? at : null,
    multiplierPunch,
    broken,
  };
};
