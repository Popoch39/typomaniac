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
  bursts: number;
  // The index of the word of the last Burst, null before the first one.
  lastBurst: number | null;
};

// The Combo lengths from which the multiplier goes up by one: the 5th word in a row is paid x2.
export const comboSteps = [5, 10, 15] as const;

export const maxMultiplier = 4;

// A Burst goes at least this many times the Pace.
export const burstMargin = 1.2;

// The letters a word needs, its space aside, to be a Burst.
export const burstMinLetters = 4;

// The Pace, in wpm, of a User without any Duel, and of a Visitor.
export const defaultPace = 50;

// The multiplier of the word at place `combo` in the Combo, counted from 1.
const multiplierOf = (combo: number) =>
  Math.min(maxMultiplier, 1 + comboSteps.filter((step) => combo >= step).length);

// Whether `chars`, typed in `ms` milliseconds, go at the Pace plus the margin or faster. A wpm is
// chars ÷ 5 per minute, compared without dividing by the time, which can be 0.
const isBurstCadence = (chars: number, ms: number, pace: number) =>
  chars * 12_000 >= pace * burstMargin * ms;

// Replays the log with the rules of the Run (ADR 0002). A right word is paid its letters and the
// space that validates it, times the multiplier of its place in the Combo. Any wrong char, erased
// or not, breaks the Combo when it is typed, so a corrected word is paid x1; a word validated
// wrong pays nothing. A word without any mistake, of 4 letters or more, typed at the `pace` (in
// wpm) plus the margin is a Burst, paid twice: it is timed from the Keystroke that validates the
// previous word, or from 0. `now` is in milliseconds since the start of the Run.
export const computeScore = (
  config: RunConfig,
  keystrokes: readonly Keystroke[],
  pace: number,
  now: number,
): ScoreState => {
  let state = createRun(config);
  let score = 0;
  let combo = 0;
  let bestCombo = 0;
  let bursts = 0;
  let lastBurst: number | null = null;
  // The words a wrong char was typed in: none of them can be a Burst anymore.
  const mistaken = new Set<number>();
  // When the word in progress started: the last validation, right or wrong.
  let wordStart = 0;

  for (const keystroke of keystrokes) {
    const verdict = judge(state, keystroke);
    const next = applyKeystroke(state, keystroke);
    const word = currentWord(state);
    const validated = next.validatedWords > state.validatedWords;

    if (verdict === "incorrect") {
      combo = 0;
      mistaken.add(word.index);
    } else if (validated) {
      const chars = word.target.length + (hasSpaceAfter(config, word.index) ? 1 : 0);

      const burst =
        !mistaken.has(word.index) &&
        word.target.length >= burstMinLetters &&
        isBurstCadence(chars, keystroke.at - wordStart, pace);

      combo++;
      bestCombo = Math.max(bestCombo, combo);
      score += chars * multiplierOf(combo) * (burst ? 2 : 1);

      if (burst) {
        bursts++;
        lastBurst = word.index;
      }
    }

    if (validated) {
      wordStart = keystroke.at;
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

  return { score, combo, multiplier, bestCombo, bursts, lastBurst };
};
