import { describe, expect, test } from "bun:test";

import { computeResult, type Keystroke, type RunConfig } from "./index";

// Seed 42 in English, version 1, starts with "small help while" (pinned in text.test.ts).
const config: RunConfig = { mode: "words", words: 3, language: "en", wordListVersion: 1, seed: 42 };

// One char Keystroke per character, `step` ms apart from `start`.
const keystrokes = (input: string, start = 0, step = 100): Keystroke[] =>
  [...input].map((char, i) => ({ kind: "char", char, at: start + i * step }));

// "smol", two backspaces, then "all help while": every word ends right, but the "o" was a mistake.
// 18 char Keystrokes.
const correctedMistake: Keystroke[] = [
  ...keystrokes("smol"),
  { kind: "backspace", at: 400 },
  { kind: "backspace", at: 500 },
  ...keystrokes("all help while"),
];

describe("computeResult", () => {
  // "hepl" is wrong but validated by space. Worked by hand:
  // - wpm: right words "small" + its space + "while" (last word, no space) = 11 chars,
  //   in 12 s = 0.2 min, so 11 / 5 / 0.2 = 11;
  // - accuracy: 16 char Keystrokes; wrong are "p", "l" and the space after "hepl", so 13 / 16;
  // - raw: the 16 char Keystrokes, wrong ones included, so 16 / 5 / 0.2 = 16.
  test("wpm, raw and accuracy of a known log", () => {
    const result = computeResult(config, keystrokes("small hepl while"), 12_000);

    expect(result.wpm).toBeCloseTo(11);
    expect(result.raw).toBeCloseTo(16);
    expect(result.accuracy).toBeCloseTo(81.25);
  });

  test("an ignored space counts neither against accuracy nor in raw", () => {
    const result = computeResult(config, keystrokes(" small help while"), 60_000);

    expect(result.accuracy).toBe(100);
    // 16 chars ("small help while") in one minute.
    expect(result.wpm).toBeCloseTo(3.2);
    expect(result.raw).toBeCloseTo(3.2);
  });

  // 18 char Keystrokes in one minute.
  test("raw counts every char Keystroke, erased ones included, but not backspaces", () => {
    expect(computeResult(config, correctedMistake, 60_000).raw).toBeCloseTo(18 / 5);
  });

  test("a letter past the end of the word is a wrong Keystroke", () => {
    const result = computeResult(config, keystrokes("smalll help while"), 60_000);

    // 17 char Keystrokes; wrong are the extra "l" and the space after the wrong "smalll".
    expect(result.accuracy).toBeCloseTo((15 / 17) * 100);
    // "smalll" is wrong: only "help " and "while" count, 10 chars.
    expect(result.wpm).toBeCloseTo(2);
  });

  test("a corrected mistake still counts against accuracy, the corrected word in wpm", () => {
    const result = computeResult(config, correctedMistake, 60_000);

    // 18 char Keystrokes, backspaces left out; only the "o" is wrong ("small" has an "l" at 3).
    expect(result.accuracy).toBeCloseTo((17 / 18) * 100);
    expect(result.accuracy).toBeLessThan(100);
    // Every word is right: 16 chars in one minute.
    expect(result.wpm).toBeCloseTo(3.2);
  });

  test("a wrong word fixed after going back to it counts in wpm", () => {
    const log: Keystroke[] = [
      ...keystrokes("smalx "),
      { kind: "deleteWord", at: 600 },
      ...keystrokes("small help while"),
    ];

    expect(computeResult(config, log, 60_000).wpm).toBeCloseTo(3.2);
  });

  test("an empty log gives zero instead of dividing by zero", () => {
    expect(computeResult(config, [], 0)).toEqual({
      wpm: 0,
      raw: 0,
      accuracy: 0,
      consistency: 0,
      chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
    });
  });

  // A `words` Run ends on its last Keystroke, here 500 ms into the second second: 4 chars in the
  // first second, 2 in the half second left, the same raw of 48 in both.
  test("the last second, when shorter, counts at its own length in consistency", () => {
    const log: Keystroke[] = [...keystrokes("smal", 0, 250), ...keystrokes("l ", 1_250, 250)];

    expect(computeResult(config, log, 1_500).consistency).toBeCloseTo(100);
  });

  // Final state: "sma" validated on "small" (3 right, "ll" missed), "helpx" on "help" (4 right,
  // 1 extra), "whxle" on "while", the last word, not validated as it is wrong (4 right, 1 wrong).
  test("counts the letters of the final state: correct, incorrect, extra and missed", () => {
    expect(computeResult(config, keystrokes("sma helpx whxle"), 60_000).chars).toEqual({
      correct: 11,
      incorrect: 1,
      extra: 1,
      missed: 2,
    });
  });

  test("a corrected mistake is gone from the letter counts", () => {
    expect(computeResult(config, correctedMistake, 60_000).chars).toEqual({
      correct: 14,
      incorrect: 0,
      extra: 0,
      missed: 0,
    });
  });
});

describe("computeResult in time Mode", () => {
  const timeConfig: RunConfig = {
    mode: "time",
    seconds: 30,
    language: "en",
    wordListVersion: 1,
    seed: 42,
  };

  // The time is up on "wh", 2 letters into "while": they count, like "bonj" on "bonjour".
  // "small " + "help " + "wh" = 13 chars in 30 s, so 13 / 5 / 0.5 = 5.2.
  test("the right letters of the current word count in wpm", () => {
    expect(computeResult(timeConfig, keystrokes("small help wh"), 30_000).wpm).toBeCloseTo(5.2);
  });

  // "wxi": "w" and "i" are right, "x" is not. "small " + "help " + 2 letters = 13 chars.
  test("only the right letters of the current word count, not the wrong ones", () => {
    expect(computeResult(timeConfig, keystrokes("small help wxi"), 30_000).wpm).toBeCloseTo(5.2);
  });

  // "ile" is still to type in "while" when the time is up: not validated, so not missed, and the
  // words past it are not counted at all.
  test("the letters left in the current word are not missed", () => {
    expect(computeResult(timeConfig, keystrokes("small help wh"), 30_000).chars).toEqual({
      correct: 11,
      incorrect: 0,
      extra: 0,
      missed: 0,
    });
  });

  // 15 chars, one every 200 ms: 5 in each of the 3 seconds, a raw of 60 each second.
  test("a raw constant from one second to the next gives a consistency of 100", () => {
    const threeSeconds: RunConfig = { ...timeConfig, seconds: 3 };

    const log = keystrokes("small help whil", 0, 200);

    expect(computeResult(threeSeconds, log, 3_000).consistency).toBeCloseTo(100);
  });

  // 5 chars in the first second, 10 in the second: raws of 60 and 120. Worked by hand: mean 90,
  // standard deviation 30, so c = 1/3 and 100 · (1 − tanh(c + c³/3 + c⁵/5)) ≈ 66.673.
  test("an irregular raw gives a lower consistency", () => {
    const twoSeconds: RunConfig = { ...timeConfig, seconds: 2 };

    const log = [...keystrokes("small", 0, 200), ...keystrokes(" help whil", 1_000, 90)];

    expect(computeResult(twoSeconds, log, 2_000).consistency).toBeCloseTo(66.673);
  });

  test("a Run without any char Keystroke has zero consistency", () => {
    const log: Keystroke[] = [{ kind: "backspace", at: 100 }];

    expect(computeResult(timeConfig, log, 30_000).consistency).toBe(0);
  });

  test("the Run lasts its duration, even when it is seen ending late", () => {
    const log: Keystroke[] = [
      ...keystrokes("small help wh"),
      { kind: "char", char: "i", at: 30_000 },
    ];

    const result = computeResult(timeConfig, log, 30_250);

    expect(result.wpm).toBeCloseTo(5.2);
    // The "i" came once the time was up: it is not a Keystroke of the Run.
    expect(result.accuracy).toBe(100);
  });
});
