import { describe, expect, test } from "vitest";

import { estimatedWaitLabel, formatElapsed, queueSizeLabel } from "@/lib/queue-wait";

describe("formatElapsed", () => {
  test("shows minutes and seconds", () => {
    expect([0, 7400, 65_000, 600_000].map(formatElapsed)).toEqual([
      "0:00",
      "0:07",
      "1:05",
      "10:00",
    ]);
  });

  test("is never negative, when the clocks drift apart", () => {
    expect(formatElapsed(-800)).toBe("0:00");
  });
});

describe("queueSizeLabel", () => {
  test("counts the User among the players", () => {
    expect(queueSizeLabel(1)).toBe("1 joueur en file");
    expect(queueSizeLabel(12)).toBe("12 joueurs en file");
  });
});

describe("estimatedWaitLabel", () => {
  test("rounds to the second above", () => {
    expect(estimatedWaitLabel(14_200)).toBe("≈ 15 s d'attente");
    expect(estimatedWaitLabel(0)).toBe("≈ 1 s d'attente");
  });

  test("says nothing without a recent pairing", () => {
    expect(estimatedWaitLabel(null)).toBeNull();
  });
});
