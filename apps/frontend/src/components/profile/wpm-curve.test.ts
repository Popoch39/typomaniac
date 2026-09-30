import { describe, expect, test } from "vitest";

import type { ProgressionPoint } from "@/api/profile";
import { TREND_DUELS, wpmAxis, wpmCurve, wpmTrend } from "@/components/profile/wpm-curve";

const point = (wpm: number, index = 0): ProgressionPoint => ({
  endedAt: 1000 * index,
  wpm,
  raw: wpm + 10,
  accuracy: 100,
  consistency: 80,
});

const points = (wpms: readonly number[]) => wpms.map((wpm, index) => point(wpm, index));

describe("wpmCurve", () => {
  test("nothing played, nothing to draw", () => {
    expect(wpmCurve([], null)).toBeNull();
  });

  test("one row per Duel, oldest first, their average, their best and the last", () => {
    const curve = wpmCurve(points([80, 100, 90]), 120);

    expect(curve?.rows).toEqual([
      { duel: 0, endedAt: 0, wpm: 80 },
      { duel: 1, endedAt: 1000, wpm: 100 },
      { duel: 2, endedAt: 2000, wpm: 90 },
    ]);
    expect(curve?.average).toBe(90);
    expect(curve?.low).toBe(80);
    expect(curve?.high).toBe(100);
    expect(curve?.best).toEqual({ duel: 1, wpm: 100, record: false });
    expect(curve?.last).toEqual({ duel: 2, wpm: 90 });
  });

  test("the best of the window is the record when none is higher", () => {
    expect(wpmCurve(points([80, 120, 90]), 120)?.best.record).toBe(true);
  });

  test("the first of equal bests is kept", () => {
    expect(wpmCurve(points([100, 80, 100]), 100)?.best).toEqual({
      duel: 0,
      wpm: 100,
      record: true,
    });
  });
});

describe("wpmTrend", () => {
  test("none under two tens of Duels", () => {
    expect(TREND_DUELS).toBe(10);
    expect(wpmTrend(points(Array.from({ length: 19 }, () => 80)))).toBeNull();
  });

  test("the last 10 Duels' average against the first 10's", () => {
    // 80 for the first 10, 90 for the next 5, 95 for the last 10.
    const wpms = [
      ...Array.from({ length: 10 }, () => 80),
      ...Array.from({ length: 5 }, () => 90),
      ...Array.from({ length: 10 }, () => 95),
    ];

    expect(wpmTrend(points(wpms))).toBe(15);
    expect(wpmTrend(points(wpms.toReversed()))).toBe(-15);
  });
});

describe("wpmAxis", () => {
  test("a margin around the curve, a line every 20 wpm over a wide range", () => {
    expect(wpmAxis(84, 128)).toEqual({ domain: [74, 138], ticks: [80, 100, 120] });
  });

  test("a line every 10 wpm over a narrower one", () => {
    expect(wpmAxis(60, 80)).toEqual({ domain: [55, 85], ticks: [60, 70, 80] });
  });

  test("a line every 5 wpm over a flat curve, never under 0", () => {
    expect(wpmAxis(60, 62)).toEqual({ domain: [56, 66], ticks: [60, 65] });
    expect(wpmAxis(0, 2)).toEqual({ domain: [0, 6], ticks: [0, 5] });
  });
});
