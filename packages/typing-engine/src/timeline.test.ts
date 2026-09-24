import { describe, expect, test } from "bun:test";

import { computeResult, computeTimeline, type Keystroke, type RunConfig } from "./index";

// Seed 42 in English, version 1, starts with "small help while" (pinned in text.test.ts).
const timeConfig: RunConfig = {
  mode: "time",
  seconds: 3,
  language: "en",
  wordListVersion: 1,
  seed: 42,
};

// One char Keystroke per character, `step` ms apart from `start`.
const keystrokes = (input: string, start = 0, step = 100): Keystroke[] =>
  [...input].map((char, i) => ({ kind: "char", char, at: start + i * step }));

describe("computeTimeline", () => {
  // "small" in the first second, " help" in the second, nothing in the third.
  test("one entry per second: cumulated wpm, the raw of the second and its Misses", () => {
    const log = [...keystrokes("small", 0, 200), ...keystrokes(" help", 1_000, 200)];

    expect(computeTimeline(timeConfig, log, 3_000)).toEqual([
      // 5 right chars in 1 s.
      { second: 1, wpm: 60, raw: 60, misses: 0 },
      // "small " + "help" = 10 right chars in 2 s.
      { second: 2, wpm: 60, raw: 60, misses: 0 },
      // A second without any Keystroke has a raw of zero.
      { second: 3, wpm: 40, raw: 0, misses: 0 },
    ]);
  });

  test("the wpm of the last second is the wpm of the Result", () => {
    const log = keystrokes("small hepl whi", 0, 150);
    const timeline = computeTimeline(timeConfig, log, 3_000);

    expect(timeline.at(-1)?.wpm).toBeCloseTo(computeResult(timeConfig, log, 3_000).wpm);
  });

  test("a corrected mistake stays a Miss", () => {
    const log: Keystroke[] = [
      ...keystrokes("smo", 0, 100),
      { kind: "backspace", at: 300 },
      ...keystrokes("all", 400, 100),
    ];

    expect(computeTimeline(timeConfig, log, 3_000)[0]?.misses).toBe(1);
  });

  // A `words` Run ended 500 ms into its second second: that second counts at its own length, and a
  // Keystroke stamped at the very end belongs to it.
  test("the last second can be shorter, and takes a Keystroke at the very end", () => {
    const words: RunConfig = { ...timeConfig, mode: "words", words: 1 };
    const log = [...keystrokes("sma", 0, 300), ...keystrokes("ll", 1_250, 250)];

    expect(computeTimeline(words, log, 1_500)).toEqual([
      { second: 1, wpm: 36, raw: 36, misses: 0 },
      // "small" in 1.5 s, 2 chars in half a second.
      { second: 2, wpm: 40, raw: 48, misses: 0 },
    ]);
  });

  test("an early end, a Forfeit, stops the timeline there", () => {
    const log = keystrokes("small", 0, 200);

    expect(computeTimeline(timeConfig, log, 1_000)).toEqual([
      { second: 1, wpm: 60, raw: 60, misses: 0 },
    ]);
  });

  test("a `time` Run seen ending late lasts its duration", () => {
    expect(computeTimeline(timeConfig, [], 3_250)).toHaveLength(3);
  });

  test("a Run that lasted nothing has no seconds", () => {
    expect(computeTimeline(timeConfig, [], 0)).toEqual([]);
  });
});
