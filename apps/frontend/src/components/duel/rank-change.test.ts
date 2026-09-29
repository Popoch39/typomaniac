import { describe, expect, test } from "vitest";

import { type DuelRanked, rankChange, tierReached } from "@/components/duel/rank-change";

const gold = (division: 4 | 3 | 2 | 1, tp: number) => ({
  tier: "gold" as const,
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
    expect(rankChange({ tp: null, previousRank: { placementsLeft: 1 }, rank: gold(4, 0) })).toEqual(
      {
        kind: "revealed",
        standing: gold(4, 0),
      },
    );
  });

  test("TP within the same Division", () => {
    expect(rankChange({ tp: -12, previousRank: gold(3, 40), rank: gold(3, 28) })).toEqual({
      kind: "moved",
      tp: -12,
      from: gold(3, 40),
      standing: gold(3, 28),
      newTier: false,
    });
  });

  test("up a Division, within the Tier", () => {
    expect(rankChange({ tp: 20, previousRank: gold(3, 90), rank: gold(2, 10) })).toMatchObject({
      kind: "promoted",
      newTier: false,
    });
  });

  test("up into a new Tier", () => {
    expect(
      rankChange({
        tp: 25,
        previousRank: { tier: "silver", division: 1, tp: 90, shielded: false },
        rank: { tier: "gold", division: 4, tp: 15, shielded: true },
      }),
    ).toMatchObject({ kind: "promoted", newTier: true });
  });

  test("down a Division", () => {
    expect(rankChange({ tp: -20, previousRank: gold(3, 5), rank: gold(4, 75) })).toMatchObject({
      kind: "demoted",
      tp: -20,
    });
  });

  test("up into Maniac", () => {
    expect(
      rankChange({
        tp: 30,
        previousRank: { tier: "diamond", division: 1, tp: 80, shielded: false },
        rank: { tier: "maniac", tp: 10, shielded: true },
      }),
    ).toMatchObject({ kind: "promoted", newTier: true });
  });
});

const change = (ranked: DuelRanked) => tierReached(rankChange(ranked));

describe("tierReached", () => {
  test("is the rank left and the rank reached when a Duel moves up into a new Tier", () => {
    const silverI = { tier: "silver" as const, division: 1 as const, tp: 90, shielded: false };
    const goldIv = { tier: "gold" as const, division: 4 as const, tp: 15, shielded: true };

    expect(change({ tp: 25, previousRank: silverI, rank: goldIv })).toEqual({
      from: silverI,
      to: goldIv,
    });
  });

  test("is Maniac when a Duel moves up into it", () => {
    const diamondI = { tier: "diamond" as const, division: 1 as const, tp: 80, shielded: false };
    const maniac = { tier: "maniac" as const, tp: 10, shielded: true };

    expect(change({ tp: 30, previousRank: diamondI, rank: maniac })).toEqual({
      from: diamondI,
      to: maniac,
    });
  });

  test("is none for a move up a Division, a demotion out of a Tier, or TP within the Division", () => {
    expect(change({ tp: 20, previousRank: gold(3, 90), rank: gold(2, 10) })).toBeNull();
    expect(
      change({
        tp: -18,
        previousRank: gold(4, 5),
        rank: { tier: "silver", division: 1, tp: 75, shielded: false },
      }),
    ).toBeNull();
    expect(change({ tp: 12, previousRank: gold(3, 40), rank: gold(3, 52) })).toBeNull();
  });

  test("is none for a Placement, or the rank it reveals", () => {
    expect(
      change({ tp: null, previousRank: { placementsLeft: 5 }, rank: { placementsLeft: 4 } }),
    ).toBeNull();
    expect(change({ tp: null, previousRank: { placementsLeft: 1 }, rank: gold(4, 0) })).toBeNull();
  });
});
