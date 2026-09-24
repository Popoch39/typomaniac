import { describe, expect, test } from "bun:test";

import {
  comboSteps,
  computeScore,
  generateText,
  type Keystroke,
  maxMultiplier,
  type RunConfig,
} from "./index";

// Seed 42 in English, version 1, starts with "small help while" (pinned in text.test.ts).
const textSource = { language: "en", wordListVersion: 1, seed: 42 } as const;

const wordsRun: RunConfig = { mode: "words", words: 3, ...textSource };

const timeRun: RunConfig = { mode: "time", seconds: 60, ...textSource };

// One char Keystroke per character, `step` ms apart from `start`.
const keystrokes = (input: string, start = 0, step = 100): Keystroke[] =>
  [...input].map((char, i) => ({ kind: "char", char, at: start + i * step }));

// The first `count` words of the Text of seed 42, each followed by its space.
const firstWords = (count: number) => generateText(42, "en", 1, count);

const typedWords = (count: number) => firstWords(count).join(" ") + " ";

// The time when the Keystrokes of `input` typed from 0 are over, to type what follows.
const after = (input: string) => input.length * 100;

// The Score of a `time` Run once the first `count` words are typed right, time not up.
const afterWords = (count: number) => computeScore(timeRun, keystrokes(typedWords(count)), 30_000);

describe("computeScore", () => {
  test("an empty log scores nothing", () => {
    expect(computeScore(timeRun, [], 0)).toEqual({
      score: 0,
      combo: 0,
      multiplier: 1,
      bestCombo: 0,
    });
  });

  test("the steps and the cap are named", () => {
    expect(comboSteps).toEqual([5, 10, 15]);
    expect(maxMultiplier).toBe(4);
  });

  // Each word is paid its letters and its space, times the multiplier of its place in the Combo:
  // x1 for the first four, x2 from the 5th, x3 from the 10th, x4 from the 15th on.
  test("the Combo raises the multiplier up to x4, then it stays there", () => {
    const multipliers = [1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4];
    const words = firstWords(multipliers.length);

    const expected = words.reduce(
      (score, word, i) => score + (word.length + 1) * (multipliers[i] ?? 0),
      0,
    );

    // The multiplier is the one of the word in progress: the 5th is paid x2 once 4 are right.
    expect(afterWords(3)).toMatchObject({ combo: 3, multiplier: 1 });
    expect(afterWords(4)).toMatchObject({ combo: 4, multiplier: 2 });
    expect(afterWords(9)).toMatchObject({ combo: 9, multiplier: 3 });
    expect(afterWords(14)).toMatchObject({ combo: 14, multiplier: 4 });
    expect(afterWords(20)).toEqual({ score: expected, combo: 20, multiplier: 4, bestCombo: 20 });
  });

  test("a mistake breaks the Combo as soon as it is typed", () => {
    const combo = typedWords(5);
    const log = [...keystrokes(combo), ...keystrokes("x", after(combo))];

    expect(computeScore(timeRun, log, 30_000)).toMatchObject({ combo: 0, multiplier: 1 });
  });

  test("an extra letter is a mistake too", () => {
    const [first = ""] = firstWords(1);

    expect(computeScore(timeRun, keystrokes(`${first}x`), 30_000).combo).toBe(0);
  });

  // Five right words, then the 6th typed after a mistake erased at once.
  test("a corrected word is paid x1 and starts the Combo again at 1", () => {
    const combo = typedWords(5);
    const [sixth = ""] = firstWords(6).slice(5);

    const log: Keystroke[] = [
      ...keystrokes(combo),
      ...keystrokes("x", after(combo)),
      { kind: "backspace", at: after(combo) + 100 },
      ...keystrokes(`${sixth} `, after(combo) + 200),
    ];

    const before = computeScore(timeRun, keystrokes(combo), 30_000);
    const score = computeScore(timeRun, log, 30_000);

    expect(score).toEqual({
      score: before.score + sixth.length + 1,
      combo: 1,
      multiplier: 1,
      bestCombo: 5,
    });
  });

  test("a word validated wrong scores nothing and resets the Combo", () => {
    const combo = typedWords(2);
    const log = [...keystrokes(combo), ...keystrokes("wrong ", after(combo))];

    const before = computeScore(timeRun, keystrokes(combo), 30_000);

    expect(computeScore(timeRun, log, 30_000)).toEqual({
      score: before.score,
      combo: 0,
      multiplier: 1,
      bestCombo: 2,
    });
  });

  test("going back to fix a word validated wrong pays it x1 without bringing the Combo back", () => {
    const combo = typedWords(5);
    const [sixth = ""] = firstWords(6).slice(5);
    const wrong = `${sixth}x `;
    const start = after(combo);

    const log: Keystroke[] = [
      ...keystrokes(combo),
      ...keystrokes(wrong, start),
      // Back to the end of the wrong word, then the extra letter erased and the word validated.
      { kind: "backspace", at: start + after(wrong) },
      { kind: "backspace", at: start + after(wrong) + 100 },
      ...keystrokes(" ", start + after(wrong) + 200),
    ];

    const before = computeScore(timeRun, keystrokes(combo), 30_000);

    expect(computeScore(timeRun, log, 30_000)).toEqual({
      score: before.score + sixth.length + 1,
      combo: 1,
      multiplier: 1,
      bestCombo: 5,
    });
  });

  // "small " + "help " + "while", the last one validated as soon as it is right.
  test("the last word of a `words` Run is paid without a space", () => {
    expect(computeScore(wordsRun, keystrokes("small help while"), 60_000)).toEqual({
      score: 6 + 5 + 5,
      combo: 3,
      multiplier: 1,
      bestCombo: 3,
    });
  });

  test("an ignored Keystroke neither breaks the Combo nor scores", () => {
    const log = keystrokes(" small help while");

    expect(computeScore(wordsRun, log, 60_000)).toMatchObject({ score: 16, combo: 3 });
  });

  // Four right words, then two letters of the 5th one, which would be paid x2, when the time is up.
  test("at the end of a `time` Run, the word in progress pays its right letters at its multiplier", () => {
    const combo = typedWords(4);
    const [fifth = ""] = firstWords(5).slice(4);
    const log = [...keystrokes(combo), ...keystrokes(fifth.slice(0, 2), after(combo))];

    const shortRun: RunConfig = { ...timeRun, seconds: 10 };
    const before = computeScore(shortRun, keystrokes(combo), 10_000);

    // Before the end the word in progress is worth nothing yet.
    expect(computeScore(shortRun, log, 9_999).score).toBe(before.score);
    expect(computeScore(shortRun, log, 10_000).score).toBe(before.score + 2 * 2);
  });

  test("the wrong letters of the word in progress at the end pay nothing, at x1", () => {
    const [first = ""] = firstWords(1);
    const shortRun: RunConfig = { ...timeRun, seconds: 10 };
    const log = keystrokes(`${first.slice(0, 2)}x`);

    expect(computeScore(shortRun, log, 10_000)).toMatchObject({ score: 2, multiplier: 1 });
  });

  test("a Keystroke after the end of a `time` Run does not count", () => {
    const shortRun: RunConfig = { ...timeRun, seconds: 1 };
    const [first = ""] = firstWords(1);
    const log = [...keystrokes(first.slice(0, 2)), ...keystrokes("x", 5_000)];

    expect(computeScore(shortRun, log, 5_000)).toEqual({
      score: 2,
      combo: 0,
      multiplier: 1,
      bestCombo: 0,
    });
  });
});
