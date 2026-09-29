import type { Stake, Standing } from "ranked";
import { describe, expect, test } from "vitest";

import { promotionDuel } from "@/components/face-off/promotion-duel";

const gold = (division: 4 | 3 | 2 | 1, tp: number): Standing => ({
  tier: "gold",
  division,
  tp,
  shielded: false,
});

const stakeTo = (win: Standing, from: Standing): Stake => ({
  win: { tp: 14, standing: win },
  loss: { tp: -11, standing: { ...from, tp: Math.max(0, from.tp - 11) } },
});

describe("promotionDuel", () => {
  test("is a Duel de promotion when a win moves up a Tier", () => {
    const platinumIv: Standing = { tier: "platinum", division: 4, tp: 5, shielded: true };

    expect(promotionDuel(gold(1, 91), stakeTo(platinumIv, gold(1, 91)))).toEqual({
      title: "Duel de promotion",
      from: gold(1, 91),
      to: platinumIv,
    });
  });

  test("is a Duel pour Maniac when a win reaches Maniac", () => {
    const diamondI: Standing = { tier: "diamond", division: 1, tp: 95, shielded: false };
    const maniac: Standing = { tier: "maniac", tp: 4, shielded: true };

    expect(promotionDuel(diamondI, stakeTo(maniac, diamondI))).toEqual({
      title: "Duel pour Maniac",
      from: diamondI,
      to: maniac,
    });
  });

  test("is none when a win only moves up a Division, or keeps it", () => {
    expect(
      promotionDuel(gold(3, 94), stakeTo({ ...gold(2, 6), shielded: true }, gold(3, 94))),
    ).toBeNull();
    expect(promotionDuel(gold(3, 50), stakeTo(gold(3, 64), gold(3, 50)))).toBeNull();
  });

  test("is none without a Stake: a Challenge or Placement", () => {
    expect(promotionDuel(null, null)).toBeNull();
    expect(promotionDuel({ placementsLeft: 3 }, null)).toBeNull();
  });
});
