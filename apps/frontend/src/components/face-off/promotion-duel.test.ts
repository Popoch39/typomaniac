import type { Stake, Standing } from "ranked";
import { describe, expect, test } from "vitest";

import { promotionDuel } from "@/components/face-off/promotion-duel";

const or = (division: 4 | 3 | 2 | 1, tp: number): Standing => ({
  tier: "or",
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
    const platineIv: Standing = { tier: "platine", division: 4, tp: 5, shielded: true };

    expect(promotionDuel(or(1, 91), stakeTo(platineIv, or(1, 91)))).toEqual({
      title: "Duel de promotion",
      from: or(1, 91),
      to: platineIv,
    });
  });

  test("is a Duel pour Maître when a win reaches Maître", () => {
    const diamantI: Standing = { tier: "diamant", division: 1, tp: 95, shielded: false };
    const maitre: Standing = { tier: "maitre", tp: 4, shielded: true };

    expect(promotionDuel(diamantI, stakeTo(maitre, diamantI))).toEqual({
      title: "Duel pour Maître",
      from: diamantI,
      to: maitre,
    });
  });

  test("is none when a win only moves up a Division, or keeps it", () => {
    expect(
      promotionDuel(or(3, 94), stakeTo({ ...or(2, 6), shielded: true }, or(3, 94))),
    ).toBeNull();
    expect(promotionDuel(or(3, 50), stakeTo(or(3, 64), or(3, 50)))).toBeNull();
  });

  test("is none without a Stake: a Challenge or Placement", () => {
    expect(promotionDuel(null, null)).toBeNull();
    expect(promotionDuel({ placementsLeft: 3 }, null)).toBeNull();
  });
});
