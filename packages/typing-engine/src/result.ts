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

// Judges a Keystroke against the state it is applied to.
const judge = (state: RunState, keystroke: Keystroke): Verdict => {
  if (isIgnored(state, keystroke)) {
    return "ignored";
  }

  const current = currentWord(state);

  // A space is right when it closes a right word.
  const expected = keystroke.char === " " ? current.target : current.target[current.typed.length];
  const actual = keystroke.char === " " ? current.typed : keystroke.char;

  return actual === expected ? "correct" : "incorrect";
};

// Chars of the right validated words, each with the space typed after it (none after the last).
const correctChars = (state: RunState) =>
  state.words
    .slice(0, state.validatedWords)
    .reduce(
      (chars, word, i) =>
        word.typed === word.target
          ? chars + word.target.length + (i < state.words.length - 1 ? 1 : 0)
          : chars,
      0,
    );

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

  const minutes = endedAt / 60_000;

  return {
    wpm: minutes === 0 ? 0 : correctChars(state) / 5 / minutes,
    accuracy: typedChars === 0 ? 0 : (rightChars / typedChars) * 100,
  };
};
