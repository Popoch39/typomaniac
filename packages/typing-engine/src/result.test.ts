import { describe, expect, test } from "bun:test";

import { computeResult, type Keystroke, type RunConfig } from "./index";

// Seed 42 in English starts with "small help while" (pinned in text.test.ts).
const config: RunConfig = { mode: "words", words: 3, language: "en", seed: 42 };

const keystrokes = (input: string): Keystroke[] =>
  [...input].map((char, i) => ({ kind: "char", char, at: i * 100 }));

describe("computeResult", () => {
  // "hepl" is wrong but validated by space. Worked by hand:
  // - wpm: right words "small" + its space + "while" (last word, no space) = 11 chars,
  //   in 12 s = 0.2 min, so 11 / 5 / 0.2 = 11;
  // - accuracy: 16 char Keystrokes; wrong are "p", "l" and the space after "hepl", so 13 / 16.
  test("wpm and accuracy of a known log", () => {
    const result = computeResult(config, keystrokes("small hepl while"), 12_000);

    expect(result.wpm).toBeCloseTo(11);
    expect(result.accuracy).toBeCloseTo(81.25);
  });

  test("an ignored space does not count against accuracy", () => {
    const result = computeResult(config, keystrokes(" small help while"), 60_000);

    expect(result.accuracy).toBe(100);
    // 16 chars ("small help while") in one minute.
    expect(result.wpm).toBeCloseTo(3.2);
  });

  test("a letter past the end of the word is a wrong Keystroke", () => {
    const result = computeResult(config, keystrokes("smalll help while"), 60_000);

    // 17 char Keystrokes; wrong are the extra "l" and the space after the wrong "smalll".
    expect(result.accuracy).toBeCloseTo((15 / 17) * 100);
    // "smalll" is wrong: only "help " and "while" count, 10 chars.
    expect(result.wpm).toBeCloseTo(2);
  });

  test("an empty log gives zero instead of dividing by zero", () => {
    expect(computeResult(config, [], 0)).toEqual({ wpm: 0, accuracy: 0 });
  });
});
