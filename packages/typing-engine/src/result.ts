import {
  applyKeystroke,
  createRun,
  currentWord,
  isIgnored,
  type Keystroke,
  type RunConfig,
  type RunState,
} from "./run";

export type Result = {
  wpm: number;
  // Percentage of right character Keystrokes, from 0 to 100.
  accuracy: number;
};

type Verdict = "correct" | "incorrect" | "ignored";

// Judges a Keystroke against the state it is applied to. Only characters count: a corrected
// mistake stays a mistake.
const judge = (state: RunState, keystroke: Keystroke): Verdict => {
  if (keystroke.kind !== "char" || isIgnored(state, keystroke)) {
    return "ignored";
  }

  const current = currentWord(state);

  // A space is right when it closes a right word.
  const expected = keystroke.char === " " ? current.target : current.target[current.typed.length];
  const actual = keystroke.char === " " ? current.typed : keystroke.char;

  return actual === expected ? "correct" : "incorrect";
};

// Every validated word is followed by the space that validated it, but the last one of a `words`
// Run, validated as soon as it is right.
const hasSpaceAfter = (config: RunConfig, index: number) =>
  config.mode === "time" || index < config.words - 1;

// Chars of the right validated words, each with its space, plus the right letters of the word in
// progress when the Run ends (a `time` Run can end in the middle of a word).
const correctChars = (state: RunState) => {
  const validated = state.words
    .slice(0, state.validatedWords)
    .reduce(
      (chars, word) =>
        word.typed === word.target
          ? chars + word.target.length + (hasSpaceAfter(state.config, word.index) ? 1 : 0)
          : chars,
      0,
    );

  const inProgress =
    state.wordIndex === state.validatedWords
      ? currentWord(state).letters.filter((letter) => letter.status === "correct").length
      : 0;

  return validated + inProgress;
};

// A `time` Run lasts its duration, whenever its end is seen: the caller's clock can only be late.
const duration = (config: RunConfig, endedAt: number) =>
  config.mode === "time" ? config.seconds * 1000 : endedAt;

// Replays the log from the start: a Result never trusts anything but the Keystrokes (ADR 0002).
export const computeResult = (
  config: RunConfig,
  keystrokes: readonly Keystroke[],
  endedAt: number,
): Result => {
  let state = createRun(config);
  let typedChars = 0;
  let rightChars = 0;

  for (const keystroke of keystrokes) {
    const verdict = judge(state, keystroke);

    if (verdict !== "ignored") {
      typedChars++;
    }

    if (verdict === "correct") {
      rightChars++;
    }

    state = applyKeystroke(state, keystroke);
  }

  const minutes = duration(config, endedAt) / 60_000;

  return {
    wpm: minutes === 0 ? 0 : correctChars(state) / 5 / minutes,
    accuracy: typedChars === 0 ? 0 : (rightChars / typedChars) * 100,
  };
};
