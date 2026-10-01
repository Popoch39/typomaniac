import { describe, expect, test } from "vitest";

import {
  addWeeks,
  byDay,
  dayKeyOf,
  friezeColumns,
  friezeEndOf,
  friezeRange,
  heatLevel,
  nextWeekOf,
  previousWeekOf,
  shownWeekOf,
  sparkPoints,
  tallyOf,
  weekKeyOf,
  weekRange,
  weekSearch,
} from "@/components/history/history-week";

// Thursday 1 October 2026, in the afternoon, in the time zone the tests run in.
const NOW = new Date(2026, 9, 1, 15, 0).getTime();

const at = (month: number, day: number, hour = 12) => new Date(2026, month, day, hour).getTime();

describe("weeks", () => {
  test("a week is named by its Monday, in the local time zone", () => {
    expect(weekKeyOf(NOW)).toBe("2026-09-28");
    expect(weekKeyOf(at(8, 28, 0))).toBe("2026-09-28");
    expect(weekKeyOf(at(9, 4, 23))).toBe("2026-09-28");
    expect(weekKeyOf(at(9, 5, 0))).toBe("2026-10-05");
    expect(dayKeyOf(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  test("its range runs from its Monday's midnight to the next one's", () => {
    expect(weekRange("2026-09-28")).toEqual({
      from: new Date(2026, 8, 28).getTime(),
      to: new Date(2026, 9, 5).getTime(),
    });
  });

  test("weeks add up across months and years", () => {
    expect(addWeeks("2026-09-28", 1)).toBe("2026-10-05");
    expect(addWeeks("2026-01-05", -1)).toBe("2025-12-29");
  });

  test.each([
    ["no week", undefined, "2026-09-28"],
    ["the current week", "2026-09-28", "2026-09-28"],
    ["a past week", "2026-06-01", "2026-06-01"],
    ["any day of a week, as its Monday", "2026-06-04", "2026-06-01"],
    ["a week to come, as the current one", "2026-10-05", "2026-09-28"],
    ["a date that is not one", "2026-02-31", "2026-09-28"],
    ["anything else", "monday", "2026-09-28"],
  ])("the week shown for %s", (_, asked, shown) => {
    expect(shownWeekOf(asked, NOW)).toBe(shown);
  });
});

describe("from week to week", () => {
  test("the current week goes without a search", () => {
    expect(weekSearch("2026-09-28", "2026-09-28")).toEqual({});
    expect(weekSearch("2026-09-21", "2026-09-28")).toEqual({ week: "2026-09-21" });
  });

  test("back to the week of the first Duel, no further", () => {
    expect(previousWeekOf("2026-09-28", at(8, 2))).toBe("2026-09-21");
    expect(previousWeekOf("2026-09-07", at(8, 2))).toBe("2026-08-31");
    expect(previousWeekOf("2026-08-31", at(8, 2))).toBeNull();
    expect(previousWeekOf("2026-09-28", null)).toBeNull();
  });

  test("on to the current week, no further", () => {
    expect(nextWeekOf("2026-09-21", "2026-09-28")).toBe("2026-09-28");
    expect(nextWeekOf("2026-09-28", "2026-09-28")).toBeNull();
  });
});

describe("the frieze", () => {
  test("ends with the current week, unless the week shown is older than its 16 weeks", () => {
    expect(friezeEndOf("2026-09-28", "2026-09-28")).toBe("2026-09-28");
    expect(friezeEndOf(addWeeks("2026-09-28", -15), "2026-09-28")).toBe("2026-09-28");
    expect(friezeEndOf(addWeeks("2026-09-28", -16), "2026-09-28")).toBe(
      addWeeks("2026-09-28", -16),
    );
  });

  test("reads its 16 weeks of Activity at once", () => {
    expect(friezeRange("2026-09-28")).toEqual({
      from: new Date(2026, 5, 15).getTime(),
      to: new Date(2026, 9, 5).getTime(),
    });
  });

  test("16 columns of 7 days, the oldest first, Monday on top, the days to come apart", () => {
    const columns = friezeColumns(
      "2026-09-28",
      "2026-10-01",
      new Map([
        ["2026-09-29", 2],
        ["2026-06-15", 7],
      ]),
    );

    expect(columns).toHaveLength(16);
    expect(columns[0]?.week).toBe("2026-06-15");
    expect(columns[0]?.days[0]).toEqual({ day: "2026-06-15", duels: 7, future: false });
    expect(columns.at(-1)?.week).toBe("2026-09-28");
    expect(columns.at(-1)?.days.map(({ duels, future }) => [duels, future])).toEqual([
      [0, false],
      [2, false],
      [0, false],
      [0, false],
      [0, true],
      [0, true],
      [0, true],
    ]);
  });

  test.each([
    [0, 0],
    [1, 1],
    [3, 3],
    [4, 4],
    [12, 4],
  ])("%i Duels heat a day to level %i", (duels, level) => {
    expect(heatLevel(duels)).toBe(level);
  });
});

const duel = (endedAt: number, outcome: "win" | "loss" | "draw", tp: number | null) => ({
  endedAt,
  outcome,
  tp,
});

describe("a week's Duels", () => {
  test("grouped by day, in their order", () => {
    const duels = [
      duel(at(8, 30, 22), "win", 18),
      duel(at(8, 30, 9), "loss", -12),
      duel(at(8, 28, 20), "draw", null),
    ];

    expect(byDay(duels)).toEqual([
      { day: "2026-09-30", duels: duels.slice(0, 2) },
      { day: "2026-09-28", duels: duels.slice(2) },
    ]);
  });

  test("tallied: Duels, wins, losses, draws and the TP they moved", () => {
    expect(
      tallyOf([
        duel(at(8, 30), "win", 18),
        duel(at(8, 30), "loss", -12),
        duel(at(8, 30), "win", null),
        duel(at(8, 30), "draw", null),
      ]),
    ).toEqual({ duels: 4, wins: 2, losses: 1, draws: 1, tp: 6 });
  });
});

describe("the wpm line of a card", () => {
  test("spans the 300 × 56 box, the top for the highest wpm of the two sides", () => {
    expect(sparkPoints([0, 50, 100], 100)).toBe("0,52 150,28 300,4");
  });

  test("flat on the floor without any wpm, and a single second spans the box", () => {
    expect(sparkPoints([0, 0], 0)).toBe("0,52 300,52");
    expect(sparkPoints([40], 80)).toBe("0,28 300,28");
    expect(sparkPoints([], 80)).toBe("");
  });
});
