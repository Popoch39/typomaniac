import { describe, expect, test } from "vitest";

import { rankLabel, signedTp } from "@/components/tier/rank/rank-label";

describe("signedTp", () => {
  test("a gain and a loss, signed", () => {
    expect(signedTp(18, "fr")).toBe("+18 TP");
    expect(signedTp(-15, "fr")).toBe("−15 TP");
    expect(signedTp(0, "fr")).toBe("+0 TP");
  });

  test("grouped the way of the Locale", () => {
    expect(signedTp(1284, "en")).toBe("+1,284 TP");
    // French groups by a narrow no-break space.
    expect(signedTp(-1284, "fr")).toBe("−1 284 TP");
  });
});

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
    expect(rankLabel({ tier: "platinum", division: 3, tp: 7, shielded: false }, "en")).toBe(
      "Platinum III · 7 TP",
    );
    expect(rankLabel({ placementsLeft: 3 }, "en")).toBe("Placement · 3 Duels left");
    expect(rankLabel({ placementsLeft: 1 }, "en")).toBe("Placement · 1 Duel left");
  });
});
