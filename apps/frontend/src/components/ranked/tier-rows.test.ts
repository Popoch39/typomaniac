import { describe, expect, test } from "vitest";

import { TIER_COUNTS, tierRows } from "@/components/ranked/tier-rows";

const summary = (rows: ReturnType<typeof tierRows>) =>
  rows.map((row) => `${row.number} ${row.tier} ${row.reach} ${row.lit}/${row.divisions}`);

describe("tierRows", () => {
  test("lists the Tiers from Maniac down to Fer, numbered from Fer", () => {
    expect(tierRows(null).map((row) => `${row.number} ${row.tier}`)).toEqual([
      "07 maniac",
      "06 diamant",
      "05 platine",
      "04 or",
      "03 argent",
      "02 bronze",
      "01 fer",
    ]);
  });

  test("lights the Divisions climbed: every one below the reader's Tier, theirs up to theirs", () => {
    expect(summary(tierRows({ tier: "or", division: 2, tp: 42, shielded: false }))).toEqual([
      "07 maniac ahead 0/1",
      "06 diamant ahead 0/4",
      "05 platine ahead 0/4",
      "04 or mine 3/4",
      "03 argent climbed 4/4",
      "02 bronze climbed 4/4",
      "01 fer climbed 4/4",
    ]);
  });

  test("a Division IV lights one, a Division I all four", () => {
    const [fer] = tierRows({ tier: "fer", division: 4, tp: 0, shielded: false }).toReversed();
    const [diamant] = tierRows({ tier: "diamant", division: 1, tp: 0, shielded: false }).slice(1);

    expect(fer?.lit).toBe(1);
    expect(diamant?.lit).toBe(4);
  });

  test("in Maniac, every Tier is climbed and Maniac's one mark lit", () => {
    expect(summary(tierRows({ tier: "maniac", tp: 250, shielded: false })).slice(0, 2)).toEqual([
      "07 maniac mine 1/1",
      "06 diamant climbed 4/4",
    ]);
  });

  test("in Placement or without a Rating, no Tier is the reader's and nothing is lit", () => {
    for (const rank of [null, { placementsLeft: 2 }]) {
      expect(tierRows(rank).every((row) => row.reach === "open" && row.lit === 0)).toBe(true);
    }
  });
});

describe("TIER_COUNTS", () => {
  test("counts the Tiers, the Divisions below Maniac and its one summit", () => {
    expect(TIER_COUNTS).toEqual({ tiers: 7, divisions: 24, summits: 1 });
  });
});
