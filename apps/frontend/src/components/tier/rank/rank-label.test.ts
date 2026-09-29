import { describe, expect, test } from "vitest";

import { rankLabel } from "@/components/tier/rank/rank-label";

describe("rankLabel", () => {
  test("a Tier and Division with their TP", () => {
    expect(rankLabel({ tier: "gold", division: 2, tp: 42, shielded: false })).toBe(
      "Gold II · 42 TP",
    );
  });

  test("Maniac without Division", () => {
    expect(rankLabel({ tier: "maniac", tp: 250, shielded: true })).toBe("Maniac · 250 TP");
  });

  test("the Placement Duels left", () => {
    expect(rankLabel({ placementsLeft: 3 })).toBe("Placement · 3 Duels restants");
    expect(rankLabel({ placementsLeft: 1 })).toBe("Placement · 1 Duel restant");
  });
});
