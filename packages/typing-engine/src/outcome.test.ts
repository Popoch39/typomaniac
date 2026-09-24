import { describe, expect, test } from "bun:test";

import { duelOutcome, type DuelSide } from "./index";

// Only the Score and the accuracy decide a Duel: the rest of the Result stays the same.
const side = (score: number, accuracy: number, wpm = 60): DuelSide => ({
  score,
  result: {
    wpm,
    raw: 80,
    accuracy,
    consistency: 70,
    chars: { correct: 100, incorrect: 3, extra: 0, missed: 0 },
  },
});

describe("duelOutcome", () => {
  test("the best Score wins, whatever the accuracy", () => {
    expect(duelOutcome(side(310, 90), side(290, 100))).toBe("first");
    expect(duelOutcome(side(290, 100), side(310, 90))).toBe("second");
  });

  test("the best Score wins over a better wpm", () => {
    expect(duelOutcome(side(420, 100, 55), side(380, 100, 70))).toBe("first");
    expect(duelOutcome(side(380, 100, 70), side(420, 100, 55))).toBe("second");
  });

  test("the same Score is decided by accuracy", () => {
    expect(duelOutcome(side(300, 97), side(300, 95))).toBe("first");
    expect(duelOutcome(side(300, 95), side(300, 97))).toBe("second");
  });

  test("the same Score and the same accuracy is a Draw, whatever the wpm", () => {
    expect(duelOutcome(side(300, 95, 62), side(300, 95, 58))).toBe("draw");
  });

  test("two players who typed nothing draw", () => {
    expect(duelOutcome(side(0, 0, 0), side(0, 0, 0))).toBe("draw");
  });
});
