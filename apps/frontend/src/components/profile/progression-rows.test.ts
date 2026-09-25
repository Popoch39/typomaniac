import { describe, expect, test } from "vitest";

import type { ProgressionPoint } from "@/api/profile";
import { ROLLING_DUELS, progressionRows } from "@/components/profile/progression-rows";

const point = (wpm: number): ProgressionPoint => ({
  endedAt: wpm * 1000,
  wpm,
  raw: wpm + 10,
  accuracy: 100,
  consistency: 80,
});

describe("progressionRows", () => {
  test("nothing played, nothing to draw", () => {
    expect(progressionRows([], "wpm")).toEqual([]);
  });

  test("one row per Duel, in order, the average of the Duels so far while fewer than 10", () => {
    const rows = progressionRows([point(10), point(20), point(60)], "wpm");

    expect(rows).toEqual([
      { duel: 0, endedAt: 10_000, value: 10, average: 10 },
      { duel: 1, endedAt: 20_000, value: 20, average: 15 },
      { duel: 2, endedAt: 60_000, value: 60, average: 30 },
    ]);
  });

  test("then the average of the last 10 Duels", () => {
    const points = Array.from({ length: 12 }, (_, index) => point(index + 1));

    const rows = progressionRows(points, "raw");

    expect(ROLLING_DUELS).toBe(10);
    // Duels 3 to 12: raw 13 to 22.
    expect(rows.at(-1)).toMatchObject({ value: 22, average: 17.5 });
    expect(rows.at(9)).toMatchObject({ value: 20, average: 15.5 });
  });
});
