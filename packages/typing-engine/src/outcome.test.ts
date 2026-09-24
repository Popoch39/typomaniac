import { describe, expect, test } from "bun:test";

import { duelOutcome, type Result } from "./index";

// Only wpm and accuracy decide a Duel: the rest of the Result stays the same.
const result = (wpm: number, accuracy: number): Result => ({
  wpm,
  raw: 80,
  accuracy,
  consistency: 70,
  chars: { correct: 100, incorrect: 3, extra: 0, missed: 0 },
});

describe("duelOutcome", () => {
  test("the best wpm wins, whatever the accuracy", () => {
    expect(duelOutcome(result(62, 90), result(58, 100))).toBe("first");
    expect(duelOutcome(result(58, 100), result(62, 90))).toBe("second");
  });

  test("the same wpm is decided by accuracy", () => {
    expect(duelOutcome(result(60, 97), result(60, 95))).toBe("first");
    expect(duelOutcome(result(60, 95), result(60, 97))).toBe("second");
  });

  test("the same wpm and the same accuracy is a Draw", () => {
    expect(duelOutcome(result(60, 95), result(60, 95))).toBe("draw");
  });

  test("two players who typed nothing draw", () => {
    expect(duelOutcome(result(0, 0), result(0, 0))).toBe("draw");
  });
});
