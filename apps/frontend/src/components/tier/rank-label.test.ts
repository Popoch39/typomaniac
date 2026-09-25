import { describe, expect, test } from "vitest";

import { rankLabel } from "@/components/tier/rank-label";

describe("rankLabel", () => {
  test("a Tier and Division with their TP", () => {
    expect(rankLabel({ tier: "or", division: 2, tp: 42, shielded: false })).toBe("Or II · 42 TP");
  });

  test("Maître without Division", () => {
    expect(rankLabel({ tier: "maitre", tp: 250, shielded: true })).toBe("Maître · 250 TP");
  });

  test("the Placement Duels left", () => {
    expect(rankLabel({ placementsLeft: 3 })).toBe("Placement · 3 Duels restants");
    expect(rankLabel({ placementsLeft: 1 })).toBe("Placement · 1 Duel restant");
  });
});
