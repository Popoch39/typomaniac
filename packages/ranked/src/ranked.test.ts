import { describe, expect, test } from "bun:test";

import {
  applyTp,
  byStanding,
  expectedScore,
  matchWindow,
  nextMmr,
  nextWidening,
  PLACEMENT_DUELS,
  rankFromMmr,
  rateDuel,
  seedMmr,
  tpDelta,
  type Standing,
} from "./index";

const standing = (over: Partial<Standing> = {}): Standing => ({
  tier: "or",
  division: 4,
  tp: 50,
  shielded: false,
  ...over,
});

describe("byStanding", () => {
  test("orders by Tier, then Division, then TP, Maître first by its TP", () => {
    const orIIIat10 = standing({ division: 3, tp: 10 });
    const orIVat90 = standing({ tp: 90 });
    const orIVat20 = standing({ tp: 20 });
    const platineIV = standing({ tier: "platine", tp: 0 });
    const maitreAt5: Standing = { tier: "maitre", tp: 5, shielded: false };
    const maitreAt300: Standing = { tier: "maitre", tp: 300, shielded: false };

    expect(
      [orIVat20, maitreAt5, orIIIat10, platineIV, maitreAt300, orIVat90].toSorted(byStanding),
    ).toEqual([maitreAt300, maitreAt5, platineIV, orIIIat10, orIVat90, orIVat20]);
  });

  test("ties an equal step and TP", () => {
    expect(byStanding(standing(), standing({ shielded: true }))).toBe(0);
  });
});

describe("seedMmr", () => {
  test("starts at 600 for the default Pace, 12 per wpm around it", () => {
    expect([50, 60, 40, 100].map(seedMmr)).toEqual([600, 720, 480, 1200]);
  });

  test("rounds a fractional Pace", () => {
    expect(seedMmr(50.4)).toBe(605);
  });
});

describe("expectedScore", () => {
  test("is a half between equal MMRs", () => {
    expect(expectedScore(800, 800)).toBe(0.5);
  });

  test("follows the Elo curve, 400 points for 10 to 1", () => {
    expect(expectedScore(1200, 800)).toBeCloseTo(10 / 11);
    expect(expectedScore(800, 1200)).toBeCloseTo(1 / 11);
  });
});

describe("nextMmr", () => {
  test("moves by K 32 out of Placement: a win, a loss and a Draw at half", () => {
    expect(nextMmr(800, 800, "win", false)).toBe(816);
    expect(nextMmr(800, 800, "loss", false)).toBe(784);
    expect(nextMmr(800, 1200, "draw", false)).toBe(813);
  });

  test("moves by K 60 in Placement", () => {
    expect(nextMmr(800, 800, "win", true)).toBe(830);
    expect(nextMmr(800, 800, "loss", true)).toBe(770);
  });
});

describe("tpDelta", () => {
  test("gives the base 20 against an equal MMR at the MMR the rank expects", () => {
    // Or IV is the 13th Division: 400 + 12 × 50.
    expect(tpDelta(standing(), 1000, 1000, "win")).toBe(20);
    expect(tpDelta(standing(), 1000, 1000, "loss")).toBe(-20);
    expect(tpDelta(standing(), 1000, 1000, "draw")).toBe(0);
  });

  test("rewards an upset and punishes losing to weaker", () => {
    expect(tpDelta(standing(), 1000, 1100, "win")).toBe(26);
    expect(tpDelta(standing(), 1000, 1100, "loss")).toBe(-14);
    expect(tpDelta(standing(), 1000, 900, "loss")).toBe(-26);
    expect(tpDelta(standing(), 1000, 1100, "draw")).toBe(6);
  });

  test("catches the rank up with an MMR above it, and down with one below", () => {
    expect(tpDelta(standing(), 1100, 1100, "win")).toBe(30);
    expect(tpDelta(standing(), 1100, 1100, "loss")).toBe(-10);
    expect(tpDelta(standing(), 900, 900, "win")).toBe(10);
    expect(tpDelta(standing(), 900, 900, "loss")).toBe(-30);
  });

  test("keeps a win or a loss within 8 and 35 TP", () => {
    expect(tpDelta(standing(), 2000, 2000, "win")).toBe(35);
    expect(tpDelta(standing(), 2000, 2000, "loss")).toBe(-8);
    expect(tpDelta(standing(), 0, 0, "win")).toBe(8);
    expect(tpDelta(standing(), 0, 0, "loss")).toBe(-35);
  });

  test("keeps a Draw within 35 TP either way, down to none", () => {
    expect(tpDelta(standing(), 2000, 2000, "draw")).toBe(35);
    expect(tpDelta(standing(), 0, 0, "draw")).toBe(-35);
  });

  test("expects 1600 from a Maître", () => {
    expect(tpDelta({ tier: "maitre", tp: 400, shielded: false }, 1600, 1600, "win")).toBe(20);
  });
});

describe("applyTp", () => {
  test("adds the TP within the Division", () => {
    expect(applyTp(standing(), 20)).toEqual(standing({ tp: 70 }));
    expect(applyTp(standing(), -20)).toEqual(standing({ tp: 30 }));
  });

  test("moves up a Division at 100 TP, carrying the surplus, shielded", () => {
    expect(applyTp(standing({ tp: 90 }), 25)).toEqual(
      standing({ division: 3, tp: 15, shielded: true }),
    );
    expect(applyTp(standing({ division: 1, tp: 80 }), 20)).toEqual(
      standing({ tier: "platine", division: 4, tp: 0, shielded: true }),
    );
  });

  test("moves up from Diamant I to Maître", () => {
    expect(applyTp(standing({ tier: "diamant", division: 1, tp: 95 }), 10)).toEqual({
      tier: "maitre",
      tp: 5,
      shielded: true,
    });
  });

  test("spends the shield on the first loss below 0, keeping the Division", () => {
    expect(applyTp(standing({ tp: 5, shielded: true }), -20)).toEqual(standing({ tp: 0 }));
  });

  test("spends the shield on a loss that stays at or above 0", () => {
    expect(applyTp(standing({ tp: 30, shielded: true }), -20)).toEqual(standing({ tp: 10 }));
  });

  test("keeps the shield through a win", () => {
    expect(applyTp(standing({ tp: 30, shielded: true }), 20)).toEqual(
      standing({ tp: 50, shielded: true }),
    );
  });

  test("drops an unshielded User below 0 to the Division below at 75 TP", () => {
    expect(applyTp(standing({ tp: 0 }), -20)).toEqual(
      standing({ tier: "argent", division: 1, tp: 75 }),
    );
    expect(applyTp(standing({ division: 2, tp: 10 }), -20)).toEqual(
      standing({ division: 3, tp: 75 }),
    );
  });

  test("never drops below Fer IV", () => {
    expect(applyTp(standing({ tier: "fer", tp: 5 }), -30)).toEqual(
      standing({ tier: "fer", tp: 0 }),
    );
  });

  test("lets a Maître's TP grow without cap", () => {
    expect(applyTp({ tier: "maitre", tp: 990, shielded: false }, 30)).toEqual({
      tier: "maitre",
      tp: 1020,
      shielded: false,
    });
  });

  test("drops a Maître below 0 to Diamant I at 75 TP", () => {
    expect(applyTp({ tier: "maitre", tp: 10, shielded: false }, -20)).toEqual(
      standing({ tier: "diamant", division: 1, tp: 75 }),
    );
  });
});

describe("rankFromMmr", () => {
  test("places at the Division whose expected MMR the MMR reaches, at 0 TP", () => {
    expect(rankFromMmr(1000)).toEqual(standing({ tp: 0 }));
    expect(rankFromMmr(1049)).toEqual(standing({ tp: 0 }));
    expect(rankFromMmr(1150)).toEqual(standing({ division: 1, tp: 0 }));
  });

  test("places at Fer IV at the lowest, Maître at the highest", () => {
    expect(rankFromMmr(100)).toEqual(standing({ tier: "fer", tp: 0 }));
    expect(rankFromMmr(3000)).toEqual({ tier: "maitre", tp: 0, shielded: false });
  });

  test("takes 5 Placement Duels to get there", () => {
    expect(PLACEMENT_DUELS).toBe(5);
  });
});

describe("matchWindow", () => {
  test("accepts ±100 MMR at first, 50 more every 5 seconds", () => {
    expect([0, 4999, 5000, 12_000, 29_999].map(matchWindow)).toEqual([100, 100, 150, 200, 350]);
  });

  test("accepts any MMR after 30 seconds", () => {
    expect(matchWindow(30_000)).toBe(Infinity);
  });
});

describe("nextWidening", () => {
  test("is the wait at which the window widens next", () => {
    expect([0, 4999, 5000, 27_000].map(nextWidening)).toEqual([5000, 5000, 10_000, 30_000]);
  });

  test("is null once the window is unlimited", () => {
    expect(nextWidening(30_000)).toBeNull();
  });
});

describe("rateDuel", () => {
  test("moves the MMR at the Placement K and counts the Placement down, without TP", () => {
    expect(rateDuel({ mmr: 600, rank: { placementsLeft: 5 } }, 600, "win")).toEqual({
      rating: { mmr: 630, rank: { placementsLeft: 4 } },
      tp: null,
    });
  });

  test("reveals the rank of the MMR after the last Placement", () => {
    expect(rateDuel({ mmr: 600, rank: { placementsLeft: 1 } }, 600, "win")).toEqual({
      rating: { mmr: 630, rank: { tier: "bronze", division: 4, tp: 0, shielded: false } },
      tp: null,
    });
  });

  test("moves the MMR and the TP of a ranked User", () => {
    expect(rateDuel({ mmr: 1000, rank: standing() }, 1000, "win")).toEqual({
      rating: { mmr: 1016, rank: standing({ tp: 70 }) },
      tp: 20,
    });
  });
});
