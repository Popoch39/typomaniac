import { describe, expect, test } from "vitest";

import { rankedPlaceOf } from "@/components/ranked/ranked-place-of";

describe("rankedPlaceOf", () => {
  test("in a Division: its name, its TP, and what is left to the next rank", () => {
    expect(rankedPlaceOf({ tier: "or", division: 2, tp: 42, shielded: false })).toEqual({
      kind: "division",
      tier: "or",
      name: "Or II",
      tp: 42,
      of: 100,
      ahead: "58 avant Or I",
    });
  });

  test("past a Division I, the next Tier's lowest; past Diamant I, Maniac", () => {
    expect(rankedPlaceOf({ tier: "argent", division: 1, tp: 90, shielded: false })).toMatchObject({
      ahead: "10 avant Or IV",
    });
    expect(rankedPlaceOf({ tier: "diamant", division: 1, tp: 0, shielded: false })).toMatchObject({
      ahead: "100 avant Maniac",
    });
  });

  test("in Maniac, its TP alone: they have no ceiling", () => {
    expect(rankedPlaceOf({ tier: "maniac", tp: 250, shielded: false })).toEqual({
      kind: "maniac",
      tp: 250,
    });
  });

  test("in Placement, the Duels played out of 5", () => {
    expect(rankedPlaceOf({ placementsLeft: 3 })).toEqual({ kind: "placement", played: 2, of: 5 });
  });

  test("without a Rating, nothing yet", () => {
    expect(rankedPlaceOf(null)).toEqual({ kind: "unranked" });
  });
});
