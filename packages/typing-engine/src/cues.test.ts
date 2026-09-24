import { describe, expect, test } from "bun:test";

import {
  computeScore,
  cuesOf,
  generateText,
  type Key,
  type Keystroke,
  replayRun,
  type RunConfig,
} from "./index";

// Seed 42 in English, version 1, starts with "small help while" (pinned in text.test.ts).
const textSource = { language: "en", wordListVersion: 1, seed: 42 } as const;

const wordsRun: RunConfig = { mode: "words", words: 3, ...textSource };

const timeRun: RunConfig = { mode: "time", seconds: 60, ...textSource };

// The first `count` words of the Text of seed 42, each followed by its space.
const typedWords = (count: number) => generateText(42, "en", 1, count).join(" ") + " ";

// A Pace no one reaches 20 % above: no word is a Burst.
const noBurst = 10_000;

// One char Keystroke per character, 100 ms apart from 0.
const keystrokes = (input: string): Keystroke[] =>
  [...input].map((char, i) => ({ kind: "char", char, at: i * 100 }));

// The Cues of `keystroke` after `log`, the way the Run store sees it: the Run and the Score right
// before and right after it.
const cuesOfLog = (config: RunConfig, log: Keystroke[], keystroke: Keystroke, pace: number) => {
  const next = [...log, keystroke];

  return cuesOf(
    { run: replayRun(config, log), score: computeScore(config, log, pace, keystroke.at) },
    keystroke,
    { run: replayRun(config, next), score: computeScore(config, next, pace, keystroke.at) },
  );
};

// The Cues of `key`, pressed 100 ms after the log of `typed`.
const cuesAfter = (typed: string, key: Key, config: RunConfig = wordsRun, pace = noBurst) =>
  cuesOfLog(config, keystrokes(typed), { ...key, at: typed.length * 100 }, pace);

const char = (c: string): Key => ({ kind: "char", char: c });

// The comboUp Cues of validating the word after `words` right ones in a `time` Run.
const comboUpAfter = (words: number) =>
  cuesAfter(typedWords(words + 1).slice(0, -1), char(" "), timeRun).filter(
    (cue) => cue.kind === "comboUp",
  );

describe("cuesOf", () => {
  test("a right letter is a Hit", () => {
    expect(cuesAfter("sm", char("a"))).toEqual([{ kind: "hit", char: "a" }]);
  });

  test("a wrong letter is a Miss", () => {
    expect(cuesAfter("sm", char("x"))).toEqual([{ kind: "miss", char: "x" }]);
  });

  test("an extra letter past the end of the word is a Miss", () => {
    expect(cuesAfter("small", char("s"))).toEqual([{ kind: "miss", char: "s" }]);
  });

  test("a space closing a right word is a Hit, then the word is validated right", () => {
    expect(cuesAfter("small", char(" "))).toEqual([
      { kind: "hit", char: " " },
      { kind: "word", index: 0, correct: true },
    ]);
  });

  test("a space closing a wrong word is a Miss, then the word is validated wrong", () => {
    expect(cuesAfter("smal", char(" "))).toEqual([
      { kind: "miss", char: " " },
      { kind: "word", index: 0, correct: false },
    ]);
  });

  test("the last letter of a `words` Run validates its last word without a space", () => {
    expect(cuesAfter("small help whil", char("e"))).toEqual([
      { kind: "hit", char: "e" },
      { kind: "word", index: 2, correct: true },
    ]);
  });

  test("a backspace that erases a letter is an Erase of a char", () => {
    expect(cuesAfter("sm", { kind: "backspace" })).toEqual([{ kind: "erase", scope: "char" }]);
  });

  test("a backspace back to a wrong previous word is an Erase of a char", () => {
    expect(cuesAfter("smal ", { kind: "backspace" })).toEqual([{ kind: "erase", scope: "char" }]);
  });

  test("a backspace that cannot go back to a right previous word causes nothing", () => {
    expect(cuesAfter("small ", { kind: "backspace" })).toEqual([]);
  });

  test("deleting a word is an Erase of a word", () => {
    expect(cuesAfter("sm", { kind: "deleteWord" })).toEqual([{ kind: "erase", scope: "word" }]);
    expect(cuesAfter("smal ", { kind: "deleteWord" })).toEqual([{ kind: "erase", scope: "word" }]);
  });

  test("deleting a word that cannot go back to a right previous word causes nothing", () => {
    expect(cuesAfter("small ", { kind: "deleteWord" })).toEqual([]);
  });

  // The multiplier is the one of the word in progress: validating the 4th right word in a row
  // makes the 5th one paid x2.
  test("the multiplier going up a step is a comboUp, up to x4 and no further", () => {
    expect(comboUpAfter(2)).toEqual([]);
    expect(comboUpAfter(3)).toEqual([{ kind: "comboUp", multiplier: 2 }]);
    expect(comboUpAfter(8)).toEqual([{ kind: "comboUp", multiplier: 3 }]);
    expect(comboUpAfter(13)).toEqual([{ kind: "comboUp", multiplier: 4 }]);
    expect(comboUpAfter(18)).toEqual([]);
  });

  test("a mistake after right words breaks the Combo, with its length", () => {
    expect(cuesAfter("small help ", char("x"), timeRun)).toEqual([
      { kind: "miss", char: "x" },
      { kind: "comboBroken", length: 2 },
    ]);
  });

  test("a Combo already broken, even by a corrected mistake, does not break again", () => {
    const log: Keystroke[] = [...keystrokes("small x"), { kind: "backspace", at: 700 }];

    expect(cuesOfLog(timeRun, log, { kind: "char", char: "x", at: 800 }, noBurst)).toEqual([
      { kind: "miss", char: "x" },
    ]);
  });

  test("a space closing a wrong word after right ones breaks the Combo", () => {
    expect(cuesAfter("small hel", char(" "), timeRun)).toEqual([
      { kind: "miss", char: " " },
      { kind: "word", index: 1, correct: false },
      { kind: "comboBroken", length: 1 },
    ]);
  });

  // At 100 ms a char, every word goes at 120 wpm, far above a Pace of 10 wpm.
  test("a word typed well above the Pace is a Burst", () => {
    expect(cuesAfter("small", char(" "), timeRun, 10)).toEqual([
      { kind: "hit", char: " " },
      { kind: "word", index: 0, correct: true },
      { kind: "burst", wordIndex: 0 },
    ]);
  });

  // "late", the 4th word, has 4 letters: it can be a Burst.
  test("one Keystroke's Cues come as stroke, word, Combo, then Burst", () => {
    expect(cuesAfter(typedWords(4).slice(0, -1), char(" "), timeRun, 10)).toEqual([
      { kind: "hit", char: " " },
      { kind: "word", index: 3, correct: true },
      { kind: "comboUp", multiplier: 2 },
      { kind: "burst", wordIndex: 3 },
    ]);
  });

  test("an ignored Keystroke causes nothing", () => {
    expect(cuesAfter("", char(" "))).toEqual([]);
    expect(cuesAfter("", { kind: "backspace" })).toEqual([]);
    expect(cuesAfter("", { kind: "deleteWord" })).toEqual([]);
  });

  test("after the end of the Run, a key causes nothing", () => {
    expect(cuesAfter("small help while", char("x"))).toEqual([]);
  });
});
