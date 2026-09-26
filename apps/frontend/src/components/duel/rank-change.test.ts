import { describe, expect, test } from "vitest";

import { type DuelRanked, rankChange, tierReached } from "@/components/duel/rank-change";

const or = (division: 4 | 3 | 2 | 1, tp: number) => ({
  tier: "or" as const,
  division,
  tp,
  shielded: false,
});

describe("rankChange", () => {
  test("a Placement Duel says how many are left", () => {
    expect(
      rankChange({ tp: null, previousRank: { placementsLeft: 5 }, rank: { placementsLeft: 4 } }),
    ).toEqual({ kind: "placement", placementsLeft: 4 });
  });

  test("the last Placement reveals the rank", () => {
    expect(rankChange({ tp: null, previousRank: { placementsLeft: 1 }, rank: or(4, 0) })).toEqual({
      kind: "revealed",
      standing: or(4, 0),
    });
  });

  test("TP within the same Division", () => {
    expect(rankChange({ tp: -12, previousRank: or(3, 40), rank: or(3, 28) })).toEqual({
      kind: "moved",
      tp: -12,
      from: or(3, 40),
      standing: or(3, 28),
      newTier: false,
    });
  });

  test("up a Division, within the Tier", () => {
    expect(rankChange({ tp: 20, previousRank: or(3, 90), rank: or(2, 10) })).toMatchObject({
      kind: "promoted",
      newTier: false,
    });
  });

  test("up into a new Tier", () => {
    expect(
      rankChange({
        tp: 25,
        previousRank: { tier: "argent", division: 1, tp: 90, shielded: false },
        rank: { tier: "or", division: 4, tp: 15, shielded: true },
      }),
    ).toMatchObject({ kind: "promoted", newTier: true });
  });

  test("down a Division", () => {
    expect(rankChange({ tp: -20, previousRank: or(3, 5), rank: or(4, 75) })).toMatchObject({
      kind: "demoted",
      tp: -20,
    });
  });

  test("up into Maître", () => {
    expect(
      rankChange({
        tp: 30,
        previousRank: { tier: "diamant", division: 1, tp: 80, shielded: false },
        rank: { tier: "maitre", tp: 10, shielded: true },
      }),
    ).toMatchObject({ kind: "promoted", newTier: true });
  });
});

const change = (ranked: DuelRanked) => tierReached(rankChange(ranked));

describe("tierReached", () => {
  test("is the rank reached when a Duel moves up into a new Tier", () => {
    const orIv = { tier: "or" as const, division: 4 as const, tp: 15, shielded: true };

    expect(
      change({
        tp: 25,
        previousRank: { tier: "argent", division: 1, tp: 90, shielded: false },
        rank: orIv,
      }),
    ).toEqual(orIv);
  });

  test("is Maître when a Duel moves up into it", () => {
    const maitre = { tier: "maitre" as const, tp: 10, shielded: true };

    expect(
      change({
        tp: 30,
        previousRank: { tier: "diamant", division: 1, tp: 80, shielded: false },
        rank: maitre,
      }),
    ).toEqual(maitre);
  });

  test("is none for a move up a Division, a demotion out of a Tier, or TP within the Division", () => {
    expect(change({ tp: 20, previousRank: or(3, 90), rank: or(2, 10) })).toBeNull();
    expect(
      change({
        tp: -18,
        previousRank: or(4, 5),
        rank: { tier: "argent", division: 1, tp: 75, shielded: false },
      }),
    ).toBeNull();
    expect(change({ tp: 12, previousRank: or(3, 40), rank: or(3, 52) })).toBeNull();
  });

  test("is none for a Placement, or the rank it reveals", () => {
    expect(
      change({ tp: null, previousRank: { placementsLeft: 5 }, rank: { placementsLeft: 4 } }),
    ).toBeNull();
    expect(change({ tp: null, previousRank: { placementsLeft: 1 }, rank: or(4, 0) })).toBeNull();
  });
});
