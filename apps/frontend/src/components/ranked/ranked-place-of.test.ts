import { describe, expect, test } from "vitest";

import { rankedPlaceOf } from "@/components/ranked/ranked-place-of";

describe("rankedPlaceOf", () => {
  test("in a Division: its name, its TP, and what is left to the next rank", () => {
    expect(rankedPlaceOf({ tier: "gold", division: 2, tp: 42, shielded: false }, "fr")).toEqual({
      kind: "division",
      tier: "gold",
      name: "Gold II",
      tp: 42,
      of: 100,
      next: "Gold I",
      toNext: "58 TP avant Gold I",
      ahead: "58 avant Gold I",
    });
  });

  test("past a Division I, the next Tier's lowest; past Diamond I, Maniac", () => {
    expect(
      rankedPlaceOf({ tier: "silver", division: 1, tp: 90, shielded: false }, "fr"),
    ).toMatchObject({
      ahead: "10 avant Gold IV",
    });
    expect(
      rankedPlaceOf({ tier: "diamond", division: 1, tp: 0, shielded: false }, "fr"),
    ).toMatchObject({
      ahead: "100 avant Maniac",
    });
  });

  test("in English, what is left to the next rank", () => {
    expect(
      rankedPlaceOf({ tier: "silver", division: 1, tp: 90, shielded: false }, "en"),
    ).toMatchObject({
      name: "Silver I",
      ahead: "10 to Gold IV",
    });
  });

  test("in Maniac, its TP alone: they have no ceiling", () => {
    expect(rankedPlaceOf({ tier: "maniac", tp: 250, shielded: false }, "fr")).toEqual({
      kind: "maniac",
      tp: 250,
    });
  });

  test("in Placement, the Duels played out of 5", () => {
    expect(rankedPlaceOf({ placementsLeft: 3 }, "fr")).toEqual({
      kind: "placement",
      played: 2,
      of: 5,
    });
  });

  test("without a Rating, nothing yet", () => {
    expect(rankedPlaceOf(null, "fr")).toEqual({ kind: "unranked" });
  });
});
