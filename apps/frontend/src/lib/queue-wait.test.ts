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
    expect(queueSizeLabel(1, "fr")).toBe("1 joueur en file");
    expect(queueSizeLabel(12, "fr")).toBe("12 joueurs en file");
  });

  test("counts them in English, the thousands grouped", () => {
    expect([0, 1, 12, 1284].map((size) => queueSizeLabel(size, "en"))).toEqual([
      "1 player in the Queue",
      "1 player in the Queue",
      "12 players in the Queue",
      "1,284 players in the Queue",
    ]);
  });
});

describe("estimatedWaitLabel", () => {
  test("rounds to the second above", () => {
    expect(estimatedWaitLabel(14_200, "fr")).toBe("≈ 15 s d'attente");
    expect(estimatedWaitLabel(0, "fr")).toBe("≈ 1 s d'attente");
  });

  test("says it in English", () => {
    expect(estimatedWaitLabel(14_200, "en")).toBe("≈ 15 s wait");
  });

  test("says nothing without a recent pairing", () => {
    expect(estimatedWaitLabel(null, "fr")).toBeNull();
  });
});
