import { generateText, type Language } from "./text";

// `words` Mode: the Run ends after `words` words.
export type RunConfig = { mode: "words"; words: number; language: Language; seed: number };

// `at` is in milliseconds since the start of the Run, stamped by the caller: the engine never
// reads the time itself (ADR 0002).
export type Keystroke = { kind: "char"; char: string; at: number };

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

export const createRun = (config: RunConfig): RunState => ({
  config,
  words: generateText(config.seed, config.language, config.words).map((target, index) =>
    toWord(index, target, ""),
  ),
  wordIndex: 0,
  letterIndex: 0,
  validatedWords: 0,
});

export const isFinished = (state: RunState) => state.validatedWords === state.words.length;

const isLastWord = (state: RunState) => state.wordIndex === state.words.length - 1;

// Validating the last word ends the Run: the caret stays on it.
const validateWord = (state: RunState): RunState =>
  isLastWord(state)
    ? { ...state, validatedWords: state.validatedWords + 1 }
    : {
        ...state,
        wordIndex: state.wordIndex + 1,
        letterIndex: 0,
        validatedWords: state.validatedWords + 1,
      };

// SAFETY: wordIndex always points into `words`, and stays on the last word once the Run ends.
export const currentWord = (state: RunState) => state.words[state.wordIndex] as RunWord;

// A Keystroke that changes nothing: after the end of the Run, or a space before the first
// letter of a word. It does not count in the Result either.
export const isIgnored = (state: RunState, keystroke: Keystroke) =>
  isFinished(state) || (keystroke.char === " " && currentWord(state).typed === "");

export const applyKeystroke = (state: RunState, keystroke: Keystroke): RunState => {
  if (isIgnored(state, keystroke)) {
    return state;
  }

  const { words, wordIndex } = state;
  const current = currentWord(state);

  // Space validates the current word, right or wrong.
  if (keystroke.char === " ") {
    return validateWord(state);
  }

  const typed = current.typed + keystroke.char;

  const next = {
    ...state,
    words: words.with(wordIndex, toWord(wordIndex, current.target, typed)),
    letterIndex: typed.length,
  };

  // The last word needs no space once it is right.
  return isLastWord(next) && typed === current.target ? validateWord(next) : next;
};
