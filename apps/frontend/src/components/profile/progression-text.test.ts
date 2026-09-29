import { describe, expect, test } from "vitest";

import type { ProgressionPoint } from "@/api/profile";
import {
  progressionFigure,
  progressionMetricName,
  progressionPointDate,
  progressionPointFigures,
} from "@/components/profile/progression-text";

// The narrow no-break space of French, between thousands.
const NNBSP = " ";

// Ended on Sep 25, 2026 at 9:05, in the local time the dates are written in.
const point: ProgressionPoint = {
  endedAt: new Date(2026, 8, 25, 9, 5).getTime(),
  wpm: 1284.36,
  raw: 70.04,
  accuracy: 96.55,
  consistency: 80,
};

describe("progressionFigure", () => {
  test("rounds to a tenth, grouped and pointed the French way", () => {
    expect(progressionFigure(1284.36, "fr")).toBe(`1${NNBSP}284,4`);
    expect(progressionFigure(62, "fr")).toBe("62");
  });

  test("rounds to a tenth, grouped and pointed the English way", () => {
    expect(progressionFigure(1284.36, "en")).toBe("1,284.4");
    expect(progressionFigure(62, "en")).toBe("62");
  });
});

describe("progressionPointFigures", () => {
  test("the four values of a Duel, the share after a space in French", () => {
    expect(progressionPointFigures(point, "fr")).toBe(
      `1${NNBSP}284,4 wpm · 70 raw · 96,6 % acc · 80 % cons`,
    );
  });

  test("the four values of a Duel, the share stuck to its figure in English", () => {
    expect(progressionPointFigures(point, "en")).toBe(
      "1,284.4 wpm · 70 raw · 96.6% acc · 80% cons",
    );
  });
});

describe("progressionMetricName", () => {
  test("names each metric the same way in both Locales", () => {
    for (const locale of ["fr", "en"] as const) {
      expect(
        (["wpm", "raw", "accuracy", "consistency"] as const).map((metric) =>
          progressionMetricName(metric, locale),
        ),
      ).toEqual(["wpm", "raw", "accuracy", "consistency"]);
    }
  });
});

describe("progressionPointDate", () => {
  test("the day and time of a Duel, the way each Locale writes them", () => {
    expect(progressionPointDate(point, "fr")).toBe("25/09/2026 09:05");
    expect(progressionPointDate(point, "en")).toBe("9/25/26, 9:05 AM");
  });
});
