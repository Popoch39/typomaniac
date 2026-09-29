import { describe, expect, test } from "vitest";

import { tpProgressOf } from "@/components/tier/rank/tp-progress-of";

describe("tpProgressOf", () => {
  test("a Division fills to its TP out of 100, in its Tier's colour", () => {
    expect(tpProgressOf({ tier: "gold", division: 2, tp: 42, shielded: false }, "fr")).toEqual({
      kind: "division",
      tp: 42,
      of: 100,
      tier: "gold",
      name: "Gold II",
      next: "Gold I",
      toNext: "58 TP avant Gold I",
    });
  });

  test("the next rank of a Division I is the next Tier's Division IV", () => {
    expect(
      tpProgressOf({ tier: "bronze", division: 1, tp: 90, shielded: false }, "fr"),
    ).toMatchObject({
      toNext: "10 TP avant Silver IV",
    });
  });

  test("past Diamond I comes Maniac, without Division", () => {
    expect(
      tpProgressOf({ tier: "diamond", division: 1, tp: 0, shielded: true }, "fr"),
    ).toMatchObject({
      toNext: "100 TP avant Maniac",
    });
  });

  test("the Placement shows the Duels played out of 5", () => {
    expect(tpProgressOf({ placementsLeft: 2 }, "fr")).toEqual({
      kind: "placement",
      played: 3,
      of: 5,
    });
  });

  test("Maniac has no ceiling: its TP alone", () => {
    expect(tpProgressOf({ tier: "maniac", tp: 250, shielded: false }, "fr")).toEqual({
      kind: "maniac",
      tp: 250,
    });
  });

  test("in English, the rank and what is left to the next", () => {
    expect(
      tpProgressOf({ tier: "gold", division: 2, tp: 42, shielded: false }, "en"),
    ).toMatchObject({
      name: "Gold II",
      next: "Gold I",
      toNext: "58 TP to Gold I",
    });
    expect(
      tpProgressOf({ tier: "diamond", division: 1, tp: 0, shielded: true }, "en"),
    ).toMatchObject({
      toNext: "100 TP to Maniac",
    });
  });

  test("without a Rating, nothing", () => {
    expect(tpProgressOf(null, "fr")).toBeNull();
  });
});
