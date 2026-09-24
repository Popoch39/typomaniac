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
  // Every char Keystroke, right or wrong, erased or not.
  raw: number;
  // Percentage of right character Keystrokes, from 0 to 100.
  accuracy: number;
  // How steady the raw stays from one second to the next, from 0 to 100.
  consistency: number;
  chars: CharCounts;
};

// Letters of the final state, spaces left out. A missed letter was skipped in a validated word.
export type CharCounts = { correct: number; incorrect: number; extra: number; missed: number };

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

// Counts the letters of the validated words and of the current one; the words past it are not
// typed yet. The current word is right after the validated ones, or the last one once they all are.
const countChars = (state: RunState): CharCounts => {
  const chars: CharCounts = { correct: 0, incorrect: 0, extra: 0, missed: 0 };

  for (const word of state.words.slice(0, state.validatedWords + 1)) {
    const validated = word.index < state.validatedWords;

    for (const letter of word.letters) {
      if (letter.status !== "pending") {
        chars[letter.status]++;
      } else if (validated) {
        chars.missed++;
      }
    }
  }

  return chars;
};

// A `time` Run lasts its duration, whenever its end is seen: the caller's clock can only be late.
const duration = (config: RunConfig, endedAt: number) =>
  config.mode === "time" ? config.seconds * 1000 : endedAt;

// The wpm of a Run in progress, `elapsed` ms after its start: the right chars so far over the time
// elapsed, capped at the duration of a `time` Run.
export const liveWpm = (state: RunState, elapsed: number) => {
  const minutes = Math.min(elapsed, duration(state.config, elapsed)) / 60_000;

  return minutes === 0 ? 0 : correctChars(state) / 5 / minutes;
};

// The raw of each second of the Run. The last second can be shorter: its raw is taken over its own
// length. A Keystroke stamped at the very end of the Run belongs to the last second.
const rawPerSecond = (typedAt: readonly number[], durationMs: number) => {
  const seconds = Math.ceil(durationMs / 1000);
  const counts = Array.from({ length: seconds }, () => 0);

  for (const at of typedAt) {
    const second = Math.min(Math.floor(at / 1000), seconds - 1);

    counts[second] = (counts[second] ?? 0) + 1;
  }

  return counts.map((count, second) => {
    const minutes = Math.min(1000, durationMs - second * 1000) / 60_000;

    return count / 5 / minutes;
  });
};

// Monkeytype's formula, from the coefficient of variation `c` of the raws: 100 when the raw stays
// the same every second, lower as it varies. Zero when nothing was typed.
const consistency = (raws: readonly number[]) => {
  const mean = raws.reduce((sum, raw) => sum + raw, 0) / raws.length;

  if (raws.length === 0 || mean === 0) {
    return 0;
  }

  const variance = raws.reduce((sum, raw) => sum + (raw - mean) ** 2, 0) / raws.length;
  const c = Math.sqrt(variance) / mean;

  return 100 * (1 - Math.tanh(c + c ** 3 / 3 + c ** 5 / 5));
};

// Replays the log from the start: a Result never trusts anything but the Keystrokes (ADR 0002).
export const computeResult = (
  config: RunConfig,
  keystrokes: readonly Keystroke[],
  endedAt: number,
): Result => {
  let state = createRun(config);
  // When each char Keystroke that counts was typed.
  const typedAt: number[] = [];
  let rightChars = 0;

  for (const keystroke of keystrokes) {
    const verdict = judge(state, keystroke);

    if (verdict !== "ignored") {
      typedAt.push(keystroke.at);
    }

    if (verdict === "correct") {
      rightChars++;
    }

    state = applyKeystroke(state, keystroke);
  }

  const durationMs = duration(config, endedAt);
  const minutes = durationMs / 60_000;
  const typedChars = typedAt.length;

  return {
    wpm: minutes === 0 ? 0 : correctChars(state) / 5 / minutes,
    raw: minutes === 0 ? 0 : typedChars / 5 / minutes,
    accuracy: typedChars === 0 ? 0 : (rightChars / typedChars) * 100,
    consistency: consistency(rawPerSecond(typedAt, durationMs)),
    chars: countChars(state),
  };
};
