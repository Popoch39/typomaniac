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

const platinumIv: Standing = { tier: "platinum", division: 4, tp: 5, shielded: true };

const diamondI: Standing = { tier: "diamond", division: 1, tp: 95, shielded: false };

const maniac: Standing = { tier: "maniac", tp: 4, shielded: true };

describe("promotionDuel", () => {
  test("is a Duel de promotion when a win moves up a Tier", () => {
    expect(promotionDuel(gold(1, 91), stakeTo(platinumIv, gold(1, 91)), "fr")).toEqual({
      title: "Duel de promotion",
      from: gold(1, 91),
      to: platinumIv,
    });
  });

  test("is a Duel pour Maniac when a win reaches Maniac", () => {
    expect(promotionDuel(diamondI, stakeTo(maniac, diamondI), "fr")).toEqual({
      title: "Duel pour Maniac",
      from: diamondI,
      to: maniac,
    });
  });

  test("is titled in English in English", () => {
    expect(promotionDuel(gold(1, 91), stakeTo(platinumIv, gold(1, 91)), "en")?.title).toBe(
      "Promotion Duel",
    );
    expect(promotionDuel(diamondI, stakeTo(maniac, diamondI), "en")?.title).toBe(
      "Maniac Promotion Duel",
    );
  });

  test("is none when a win only moves up a Division, or keeps it", () => {
    expect(
      promotionDuel(gold(3, 94), stakeTo({ ...gold(2, 6), shielded: true }, gold(3, 94)), "fr"),
    ).toBeNull();
    expect(promotionDuel(gold(3, 50), stakeTo(gold(3, 64), gold(3, 50)), "fr")).toBeNull();
  });

  test("is none without a Stake: a Challenge or Placement", () => {
    expect(promotionDuel(null, null, "fr")).toBeNull();
    expect(promotionDuel({ placementsLeft: 3 }, null, "fr")).toBeNull();
  });
});
