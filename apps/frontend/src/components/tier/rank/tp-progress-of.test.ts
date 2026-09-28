import { describe, expect, test } from "vitest";

import { tpProgressOf } from "@/components/tier/rank/tp-progress-of";

describe("tpProgressOf", () => {
  test("a Division fills to its TP out of 100, in its Tier's colour", () => {
    expect(tpProgressOf({ tier: "or", division: 2, tp: 42, shielded: false })).toEqual({
      kind: "division",
      tp: 42,
      of: 100,
      tier: "or",
      toNext: "58 TP avant Or I",
    });
  });

  test("the next rank of a Division I is the next Tier's Division IV", () => {
    expect(tpProgressOf({ tier: "bronze", division: 1, tp: 90, shielded: false })).toMatchObject({
      toNext: "10 TP avant Argent IV",
    });
  });

  test("past Diamant I comes Maniac, without Division", () => {
    expect(tpProgressOf({ tier: "diamant", division: 1, tp: 0, shielded: true })).toMatchObject({
      toNext: "100 TP avant Maniac",
    });
  });

  test("the Placement shows the Duels played out of 5", () => {
    expect(tpProgressOf({ placementsLeft: 2 })).toEqual({ kind: "placement", played: 3, of: 5 });
  });

  test("Maniac has no ceiling: its TP alone", () => {
    expect(tpProgressOf({ tier: "maniac", tp: 250, shielded: false })).toEqual({
      kind: "maniac",
      tp: 250,
    });
  });

  test("without a Rating, nothing", () => {
    expect(tpProgressOf(null)).toBeNull();
  });
});
