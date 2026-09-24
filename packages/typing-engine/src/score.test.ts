import { describe, expect, test } from "bun:test";

import {
  burstMargin,
  burstMinLetters,
  comboSteps,
  computeScore,
  defaultPace,
  generateText,
  type Keystroke,
  maxMultiplier,
  type RunConfig,
} from "./index";

// Seed 42 in English, version 1, starts with "small help while" (pinned in text.test.ts). Its 14th
// word, "run", is the first one under 4 letters.
const textSource = { language: "en", wordListVersion: 1, seed: 42 } as const;

const wordsRun: RunConfig = { mode: "words", words: 3, ...textSource };

const timeRun: RunConfig = { mode: "time", seconds: 60, ...textSource };

const shortRun: RunConfig = { ...timeRun, seconds: 10 };

// A Pace no one reaches 20 % above: no word is a Burst, the Combo alone is at play.
const noBurst = 10_000;

// No Burst, so no word index for the last one.
const noBursts = { bursts: 0, lastBurst: null };

// One char Keystroke per character, `step` ms apart from `start`.
const keystrokes = (input: string, start = 0, step = 100): Keystroke[] =>
  [...input].map((char, i) => ({ kind: "char", char, at: start + i * step }));

// The first `count` words of the Text of seed 42, each followed by its space.
const firstWords = (count: number) => generateText(42, "en", 1, count);

const typedWords = (count: number) => firstWords(count).join(" ") + " ";

// The time when the Keystrokes of `input` typed from 0 are over, to type what follows.
const after = (input: string) => input.length * 100;

// The Score of a `time` Run once the first `count` words are typed right, time not up. At 100 ms
// a char, every word goes at 120 wpm.
const afterWords = (count: number, pace = noBurst) =>
  computeScore(timeRun, keystrokes(typedWords(count)), pace, 30_000);

describe("computeScore", () => {
  test("an empty log scores nothing", () => {
    expect(computeScore(timeRun, [], noBurst, 0)).toEqual({
      score: 0,
      combo: 0,
      multiplier: 1,
      bestCombo: 0,
      ...noBursts,
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

    expect(afterWords(20)).toEqual({
      score: expected,
      combo: 20,
      multiplier: 4,
      bestCombo: 20,
      ...noBursts,
    });
  });

  test("a mistake breaks the Combo as soon as it is typed", () => {
    const combo = typedWords(5);
    const log = [...keystrokes(combo), ...keystrokes("x", after(combo))];

    expect(computeScore(timeRun, log, noBurst, 30_000)).toMatchObject({ combo: 0, multiplier: 1 });
  });

  test("an extra letter is a mistake too", () => {
    const [first = ""] = firstWords(1);

    expect(computeScore(timeRun, keystrokes(`${first}x`), noBurst, 30_000).combo).toBe(0);
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

    const before = computeScore(timeRun, keystrokes(combo), noBurst, 30_000);
    const score = computeScore(timeRun, log, noBurst, 30_000);

    expect(score).toEqual({
      score: before.score + sixth.length + 1,
      combo: 1,
      multiplier: 1,
      bestCombo: 5,
      ...noBursts,
    });
  });

  test("a word validated wrong scores nothing and resets the Combo", () => {
    const combo = typedWords(2);
    const log = [...keystrokes(combo), ...keystrokes("wrong ", after(combo))];

    const before = computeScore(timeRun, keystrokes(combo), noBurst, 30_000);

    expect(computeScore(timeRun, log, noBurst, 30_000)).toEqual({
      score: before.score,
      combo: 0,
      multiplier: 1,
      bestCombo: 2,
      ...noBursts,
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

    const before = computeScore(timeRun, keystrokes(combo), noBurst, 30_000);

    expect(computeScore(timeRun, log, noBurst, 30_000)).toEqual({
      score: before.score + sixth.length + 1,
      combo: 1,
      multiplier: 1,
      bestCombo: 5,
      ...noBursts,
    });
  });

  // "small " + "help " + "while", the last one validated as soon as it is right.
  test("the last word of a `words` Run is paid without a space", () => {
    expect(computeScore(wordsRun, keystrokes("small help while"), noBurst, 60_000)).toEqual({
      score: 6 + 5 + 5,
      combo: 3,
      multiplier: 1,
      bestCombo: 3,
      ...noBursts,
    });
  });

  test("an ignored Keystroke neither breaks the Combo nor scores", () => {
    const log = keystrokes(" small help while");

    expect(computeScore(wordsRun, log, noBurst, 60_000)).toMatchObject({ score: 16, combo: 3 });
  });

  // Four right words, then two letters of the 5th one, which would be paid x2, when the time is up.
  test("at the end of a `time` Run, the word in progress pays its right letters at its multiplier", () => {
    const combo = typedWords(4);
    const [fifth = ""] = firstWords(5).slice(4);
    const log = [...keystrokes(combo), ...keystrokes(fifth.slice(0, 2), after(combo))];

    const before = computeScore(shortRun, keystrokes(combo), noBurst, 10_000);

    // Before the end the word in progress is worth nothing yet.
    expect(computeScore(shortRun, log, noBurst, 9_999).score).toBe(before.score);
    expect(computeScore(shortRun, log, noBurst, 10_000).score).toBe(before.score + 2 * 2);
  });

  test("the wrong letters of the word in progress at the end pay nothing, at x1", () => {
    const [first = ""] = firstWords(1);
    const log = keystrokes(`${first.slice(0, 2)}x`);

    expect(computeScore(shortRun, log, noBurst, 10_000)).toMatchObject({ score: 2, multiplier: 1 });
  });

  test("a Keystroke after the end of a `time` Run does not count", () => {
    const oneSecond: RunConfig = { ...timeRun, seconds: 1 };
    const [first = ""] = firstWords(1);
    const log = [...keystrokes(first.slice(0, 2)), ...keystrokes("x", 5_000)];

    expect(computeScore(oneSecond, log, noBurst, 5_000)).toEqual({
      score: 2,
      combo: 0,
      multiplier: 1,
      bestCombo: 0,
      ...noBursts,
    });
  });
});

// At the default Pace of 50 wpm, a Burst goes at 60 wpm or more: 5 chars a second.

// "small " is 6 chars: at 60 wpm, 1200 ms from the start of the Run to its space.
const firstWordValidatedAt = (at: number) =>
  computeScore(timeRun, [...keystrokes("small"), ...keystrokes(" ", at)], defaultPace, 30_000);

// "small " and "help " at 120 wpm, the space of "help" at 1000 ms. "while" is 5 chars: 60 wpm is
// its last letter at 2000 ms, where its space would have made it 6 chars, a Burst up to 2200 ms.
const lastWordRightAt = (at: number) =>
  computeScore(
    wordsRun,
    [...keystrokes("small help "), ...keystrokes("whil", 1_100), ...keystrokes("e", at)],
    defaultPace,
    60_000,
  );

describe("computeScore with Bursts", () => {
  test("the margin, the shortest word and the default Pace are named", () => {
    expect(burstMargin).toBe(1.2);
    expect(burstMinLetters).toBe(4);
    expect(defaultPace).toBe(50);
  });

  test("a word at the Pace plus the margin is a Burst: its points are doubled", () => {
    expect(firstWordValidatedAt(1_199)).toMatchObject({ score: 12, bursts: 1, lastBurst: 0 });
    expect(firstWordValidatedAt(1_200)).toMatchObject({ score: 12, bursts: 1, lastBurst: 0 });
  });

  test("a word just under the Pace plus the margin is no Burst", () => {
    expect(firstWordValidatedAt(1_201)).toMatchObject({ score: 6, ...noBursts });
  });

  // Typed in 50 ms, but 2 s after the start of the Run: 35 wpm.
  test("the first word is timed from the start of the Run", () => {
    const log = keystrokes("small ", 2_000, 10);

    expect(computeScore(timeRun, log, defaultPace, 30_000)).toMatchObject({
      score: 6,
      ...noBursts,
    });
  });

  // "small " at 120 wpm, space at 500 ms. "help " typed in 40 ms, from 2000 ms: 39 wpm.
  test("a word is timed from the space that validates the previous one", () => {
    const log = [...keystrokes("small "), ...keystrokes("help ", 2_000, 10)];

    expect(computeScore(timeRun, log, defaultPace, 30_000)).toMatchObject({
      score: 12 + 5,
      bursts: 1,
      lastBurst: 0,
    });
  });

  // Every word goes at 120 wpm, but "run", the 14th, has 3 letters. It is paid x3, not doubled.
  test("a word under 4 letters is never a Burst", () => {
    expect(afterWords(14, defaultPace)).toMatchObject({ bursts: 13, lastBurst: 12 });
    expect(afterWords(14, defaultPace).score - afterWords(13, defaultPace).score).toBe(4 * 3);
  });

  // "floor ", the 15th word, carries x4 and a Burst.
  test("a Burst adds up with the Combo", () => {
    expect(afterWords(15, defaultPace).score - afterWords(14, defaultPace).score).toBe(6 * 4 * 2);
    expect(afterWords(15, defaultPace)).toMatchObject({ bursts: 14, lastBurst: 14 });
  });

  test("the last word of a `words` Run is timed to its last letter, without a space", () => {
    expect(lastWordRightAt(2_000)).toMatchObject({ score: 12 + 10 + 10, bursts: 3, lastBurst: 2 });
    expect(lastWordRightAt(2_100)).toMatchObject({ score: 12 + 10 + 5, bursts: 2, lastBurst: 1 });
  });

  // Five Bursts, then "sell " fast enough, but after a mistake erased at once.
  test("a corrected word, paid x1, is never a Burst", () => {
    const combo = typedWords(5);

    const log: Keystroke[] = [
      ...keystrokes(combo),
      ...keystrokes("x", after(combo)),
      { kind: "backspace", at: after(combo) + 100 },
      ...keystrokes("sell ", after(combo) + 200),
    ];

    const before = afterWords(5, defaultPace);

    expect(computeScore(timeRun, log, defaultPace, 30_000)).toMatchObject({
      score: before.score + 5,
      bursts: 5,
      lastBurst: 4,
    });
  });

  test("a word validated wrong, then fixed, is never a Burst", () => {
    const combo = typedWords(5);
    const start = after(combo);

    const log: Keystroke[] = [
      ...keystrokes(combo),
      ...keystrokes("sellx ", start),
      { kind: "backspace", at: start + 600 },
      { kind: "backspace", at: start + 700 },
      ...keystrokes(" ", start + 800),
    ];

    const before = afterWords(5, defaultPace);

    expect(computeScore(timeRun, log, defaultPace, 30_000)).toMatchObject({
      score: before.score + 5,
      bursts: 5,
      lastBurst: 4,
    });
  });

  // The mistake belongs to "help", validated wrong: "while" is typed without any.
  test("the word after a word validated wrong can be a Burst", () => {
    const log = keystrokes("small wrong while ");

    expect(computeScore(timeRun, log, defaultPace, 30_000)).toMatchObject({
      score: 12 + 12,
      bursts: 2,
      lastBurst: 2,
    });
  });

  // Four right letters of "small" in 300 ms when the time is up.
  test("the word in progress at the end of a `time` Run is never a Burst", () => {
    expect(computeScore(shortRun, keystrokes("smal"), defaultPace, 10_000)).toMatchObject({
      score: 4,
      ...noBursts,
    });
  });
});
