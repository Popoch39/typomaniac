import { generateText, type Language } from "./text";

// `words` Mode: the Run ends after `words` words. `time` Mode: the Run ends `seconds` after its
// first Keystroke, and its Text never runs out.
export type RunConfig =
  | { mode: "words"; words: number; language: Language; seed: number }
  | { mode: "time"; seconds: number; language: Language; seed: number };

// What the player pressed: a character (space included), backspace, or Ctrl+Backspace.
export type Key = { kind: "char"; char: string } | { kind: "backspace" } | { kind: "deleteWord" };

// `at` is in milliseconds since the start of the Run, stamped by the caller: the engine never
// reads the time itself (ADR 0002).
export type Keystroke = Key & { at: number };

export type LetterStatus = "correct" | "incorrect" | "extra" | "pending";

// `char` is the expected letter, or the typed one for an extra letter. `index` is the position
// in the word: letters and words have no other identity (the same one can appear twice).
export type Letter = { index: number; char: string; status: LetterStatus };

export type RunWord = { index: number; target: string; typed: string; letters: readonly Letter[] };

export type RunState = {
  config: RunConfig;
  words: readonly RunWord[];
  wordIndex: number;
  letterIndex: number;
  validatedWords: number;
};

const letterStatus = (expected: string, typed: string | undefined): LetterStatus => {
  if (typeof typed === "undefined") {
    return "pending";
  }

  return typed === expected ? "correct" : "incorrect";
};

const toWord = (index: number, target: string, typed: string): RunWord => {
  const expected = [...target].map((char, i): Letter => ({
    index: i,
    char,
    status: letterStatus(char, typed[i]),
  }));

  const extra = Array.from(typed.slice(target.length), (char, i): Letter => ({
    index: target.length + i,
    char,
    status: "extra",
  }));

  return { index, target, typed, letters: [...expected, ...extra] };
};

// In `time` Mode the Text is drawn as the caret moves, `lookahead` words at a time, so there are
// always at least `lookahead` words past the current one.
const lookahead = 50;

const drawnWords = (config: RunConfig, wordIndex: number) =>
  config.mode === "words" ? config.words : (Math.floor(wordIndex / lookahead) + 2) * lookahead;

// Draws the words the current one needs past it. The Text of the Seed stays the same: the word at
// index i does not depend on how many are drawn.
const drawText = (state: RunState): RunState => {
  const count = drawnWords(state.config, state.wordIndex);

  if (count <= state.words.length) {
    return state;
  }

  const drawn = generateText(state.config.seed, state.config.language, count)
    .slice(state.words.length)
    .map((target, i) => toWord(state.words.length + i, target, ""));

  return { ...state, words: [...state.words, ...drawn] };
};

export const createRun = (config: RunConfig): RunState =>
  drawText({ config, words: [], wordIndex: 0, letterIndex: 0, validatedWords: 0 });

// `now` is in milliseconds since the start of the Run, like a Keystroke's `at`: a `time` Run ends
// on the clock, a `words` Run on its last word.
export const isFinished = (state: RunState, now: number) =>
  state.config.mode === "time"
    ? now >= state.config.seconds * 1000
    : state.validatedWords === state.config.words;

// A `time` Run has no last word.
const isLastWord = (state: RunState) =>
  state.config.mode === "words" && state.wordIndex === state.config.words - 1;

// Validating the last word ends the Run: the caret stays on it.
const validateWord = (state: RunState): RunState =>
  isLastWord(state)
    ? { ...state, validatedWords: state.validatedWords + 1 }
    : drawText({
        ...state,
        wordIndex: state.wordIndex + 1,
        letterIndex: 0,
        validatedWords: state.validatedWords + 1,
      });

// SAFETY: wordIndex always points into `words`, and stays on the last word once the Run ends.
export const currentWord = (state: RunState) => state.words[state.wordIndex] as RunWord;

// A Keystroke that changes nothing: after the end of the Run, or a space before the first letter
// of a word. It does not count in the Result either.
export const isIgnored = (state: RunState, keystroke: Keystroke) =>
  isFinished(state, keystroke.at) ||
  (keystroke.kind === "char" && keystroke.char === " " && currentWord(state).typed === "");

// Replaces what was typed in the current word, the caret after it.
const retype = (state: RunState, typed: string): RunState => ({
  ...state,
  words: state.words.with(
    state.wordIndex,
    toWord(state.wordIndex, currentWord(state).target, typed),
  ),
  letterIndex: typed.length,
});

const typeChar = (state: RunState, char: string): RunState => {
  const current = currentWord(state);

  // Space validates the current word, right or wrong.
  if (char === " ") {
    return validateWord(state);
  }

  const next = retype(state, current.typed + char);

  // The last word needs no space once it is right.
  return isLastWord(next) && currentWord(next).typed === current.target ? validateWord(next) : next;
};

// From the start of a word, the caret goes back to the end of the previous one, but only when that
// word holds a mistake: a right word is never typed again. Null when it cannot go back.
const backToPreviousWord = (state: RunState): RunState | null => {
  const previous = state.words[state.wordIndex - 1];

  if (typeof previous === "undefined" || previous.typed === previous.target) {
    return null;
  }

  return {
    ...state,
    wordIndex: previous.index,
    letterIndex: previous.typed.length,
    validatedWords: state.validatedWords - 1,
  };
};

// Backspace erases the last letter, or goes back to the end of the previous word.
const eraseLetter = (state: RunState): RunState => {
  if (currentWord(state).typed !== "") {
    return retype(state, currentWord(state).typed.slice(0, -1));
  }

  return backToPreviousWord(state) ?? state;
};

// Ctrl+Backspace erases the current word, or goes back to the previous word and erases it.
const eraseWord = (state: RunState): RunState => {
  if (currentWord(state).typed !== "") {
    return retype(state, "");
  }

  const previous = backToPreviousWord(state);

  return previous === null ? state : retype(previous, "");
};

export const applyKeystroke = (state: RunState, keystroke: Keystroke): RunState => {
  if (isIgnored(state, keystroke)) {
    return state;
  }

  switch (keystroke.kind) {
    case "char":
      return typeChar(state, keystroke.char);
    case "backspace":
      return eraseLetter(state);
    case "deleteWord":
      return eraseWord(state);
  }
};
