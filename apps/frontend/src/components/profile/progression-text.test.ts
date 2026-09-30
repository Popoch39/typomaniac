import { describe, expect, test } from "vitest";

import { progressionFigure, progressionPointDate } from "@/components/profile/progression-text";

// The narrow no-break space of French, between thousands.
const NNBSP = " ";

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

describe("progressionPointDate", () => {
  // Ended on Sep 25, 2026 at 9:05, in the local time the dates are written in.
  const point = { endedAt: new Date(2026, 8, 25, 9, 5).getTime() };

  test("the day and time of a Duel, the way each Locale writes them", () => {
    expect(progressionPointDate(point, "fr")).toBe("25/09/2026 09:05");
    expect(progressionPointDate(point, "en")).toBe("9/25/26, 9:05 AM");
  });
});
