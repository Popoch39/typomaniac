import { hasSpaceAfter, judge } from "./result";
import {
  applyKeystroke,
  createRun,
  currentWord,
  isFinished,
  type Keystroke,
  type RunConfig,
} from "./run";

export type ScoreState = {
  score: number;
  // Right words in a row typed without a single mistake, even a corrected one.
  combo: number;
  // What the word in progress will be paid times, given its place in the Combo.
  multiplier: number;
  bestCombo: number;
};

// The Combo lengths from which the multiplier goes up by one: the 5th word in a row is paid x2.
export const comboSteps = [5, 10, 15] as const;

export const maxMultiplier = 4;

// The multiplier of the word at place `combo` in the Combo, counted from 1.
const multiplierOf = (combo: number) =>
  Math.min(maxMultiplier, 1 + comboSteps.filter((step) => combo >= step).length);

// Replays the log with the rules of the Run (ADR 0002). A right word is paid its letters and the
// space that validates it, times the multiplier of its place in the Combo. Any wrong char, erased
// or not, breaks the Combo when it is typed, so a corrected word is paid x1; a word validated
// wrong pays nothing. `now` is in milliseconds since the start of the Run.
export const computeScore = (
  config: RunConfig,
  keystrokes: readonly Keystroke[],
  now: number,
): ScoreState => {
  let state = createRun(config);
  let score = 0;
  let combo = 0;
  let bestCombo = 0;

  for (const keystroke of keystrokes) {
    const verdict = judge(state, keystroke);
    const next = applyKeystroke(state, keystroke);

    if (verdict === "incorrect") {
      combo = 0;
    } else if (next.validatedWords > state.validatedWords) {
      const word = currentWord(state);
      const chars = word.target.length + (hasSpaceAfter(config, word.index) ? 1 : 0);

      combo++;
      bestCombo = Math.max(bestCombo, combo);
      score += chars * multiplierOf(combo);
    }

    state = next;
  }

  // The word in progress comes next in the Combo, or starts a new one after a mistake.
  const multiplier = multiplierOf(combo + 1);

  // A `time` Run can end in the middle of a word: its right letters count, at its multiplier.
  if (config.mode === "time" && isFinished(state, now)) {
    const right = currentWord(state).letters.filter((letter) => letter.status === "correct");

    score += right.length * multiplier;
  }

  return { score, combo, multiplier, bestCombo };
};
