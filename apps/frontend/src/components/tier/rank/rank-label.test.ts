import { describe, expect, test } from "vitest";

import { rankLabel } from "@/components/tier/rank/rank-label";

describe("rankLabel", () => {
  test("a Tier and Division with their TP", () => {
    expect(rankLabel({ tier: "gold", division: 2, tp: 42, shielded: false }, "fr")).toBe(
      "Gold II · 42 TP",
    );
  });

  test("Maniac without Division", () => {
    expect(rankLabel({ tier: "maniac", tp: 250, shielded: true }, "fr")).toBe("Maniac · 250 TP");
  });

  test("the Placement Duels left", () => {
    expect(rankLabel({ placementsLeft: 3 }, "fr")).toBe("Placement · 3 Duels restants");
    expect(rankLabel({ placementsLeft: 1 }, "fr")).toBe("Placement · 1 Duel restant");
  });

  test("in English, the Placement Duels left counted", () => {
    expect(rankLabel({ tier: "maniac", tp: 1284, shielded: true }, "en")).toBe("Maniac · 1,284 TP");
    expect(rankLabel({ placementsLeft: 3 }, "en")).toBe("Placement · 3 Duels left");
    expect(rankLabel({ placementsLeft: 1 }, "en")).toBe("Placement · 1 Duel left");
  });
});
