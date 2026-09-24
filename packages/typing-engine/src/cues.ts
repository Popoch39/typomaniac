import { judge } from "./result";
import type { Keystroke, RunState, RunWord } from "./run";
import type { ScoreState } from "./score";

// The Run and its Score at one moment, right before or right after a Keystroke.
export type Moment = { run: RunState; score: ScoreState };

// What a Keystroke just caused (ADR 0006).
export type Cue =
  | { kind: "hit"; char: string }
  | { kind: "miss"; char: string }
  | { kind: "erase"; scope: "char" | "word" }
  | { kind: "word"; index: number; correct: boolean }
  | { kind: "comboUp"; multiplier: number }
  | { kind: "comboBroken"; length: number }
  | { kind: "burst"; wordIndex: number };

// Every erase moves the caret back, or does nothing at all.
const caretMoved = (before: RunState, after: RunState) =>
  before.wordIndex !== after.wordIndex || before.letterIndex !== after.letterIndex;

// A char Keystroke is a Hit or a Miss with the same verdict as in the Result: a space closing a
// wrong word, or an extra letter, is a Miss. An erase is an Erase only when it erased something.
// An ignored Keystroke causes nothing.
const strokeCue = (before: Moment, keystroke: Keystroke, after: Moment): Cue | null => {
  if (keystroke.kind !== "char") {
    return caretMoved(before.run, after.run)
      ? { kind: "erase", scope: keystroke.kind === "backspace" ? "char" : "word" }
      : null;
  }

  switch (judge(before.run, keystroke)) {
    case "correct":
      return { kind: "hit", char: keystroke.char };
    case "incorrect":
      return { kind: "miss", char: keystroke.char };
    case "ignored":
      return null;
  }
};

// The word a Keystroke validated, by a space or by the last letter of a `words` Run: the one the
// caret was on. Null when no word was validated.
const wordCue = (before: Moment, after: Moment): Cue | null => {
  if (after.run.validatedWords <= before.run.validatedWords) {
    return null;
  }

  // SAFETY: the validated word was the current one before the Keystroke, so it is in `words`.
  const word = after.run.words[before.run.wordIndex] as RunWord;

  return { kind: "word", index: word.index, correct: word.typed === word.target };
};

// The multiplier of the word in progress going up a step, or a Combo falling back to zero.
const comboCue = (before: Moment, after: Moment): Cue | null => {
  if (after.score.multiplier > before.score.multiplier) {
    return { kind: "comboUp", multiplier: after.score.multiplier };
  }

  return before.score.combo > 0 && after.score.combo === 0
    ? { kind: "comboBroken", length: before.score.combo }
    : null;
};

const burstCue = (before: Moment, after: Moment): Cue | null =>
  after.score.bursts > before.score.bursts && after.score.lastBurst !== null
    ? { kind: "burst", wordIndex: after.score.lastBurst }
    : null;

// Compares the Run and the Score right before and right after a Keystroke. The Cues come in a
// stable order: the stroke (or the erase), then the word it validates, the Combo, the Burst.
export const cuesOf = (before: Moment, keystroke: Keystroke, after: Moment): Cue[] =>
  [
    strokeCue(before, keystroke, after),
    wordCue(before, after),
    comboCue(before, after),
    burstCue(before, after),
  ].filter((cue) => cue !== null);
