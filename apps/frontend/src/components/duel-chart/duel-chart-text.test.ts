import { describe, expect, test } from "vitest";

import { duelChartConfig, duelChartFigure } from "@/components/duel-chart/duel-chart-text";

const labels = (config: ReturnType<typeof duelChartConfig>) =>
  Object.fromEntries(Object.entries(config).map(([key, { label }]) => [key, label]));

describe("duelChartConfig", () => {
  test("names each series after its player, in French", () => {
    expect(labels(duelChartConfig({ handle: "alan" }, "fr"))).toEqual({
      ownWpm: "Toi wpm",
      ownRaw: "Toi raw",
      ownMisses: "Toi Misses",
      opponentWpm: "@alan wpm",
      opponentRaw: "@alan raw",
      opponentMisses: "@alan Misses",
    });
  });

  test("and in English", () => {
    expect(labels(duelChartConfig({ handle: "alan" }, "en"))).toEqual({
      ownWpm: "Your wpm",
      ownRaw: "Your raw",
      ownMisses: "Your Misses",
      opponentWpm: "@alan's wpm",
      opponentRaw: "@alan's raw",
      opponentMisses: "@alan's Misses",
    });
  });

  test("a deleted opponent leaves the User's series only", () => {
    expect(Object.keys(duelChartConfig(null, "en"))).toEqual(["ownWpm", "ownRaw", "ownMisses"]);
  });
});

describe("duelChartFigure", () => {
  test("a value of an axis or the tooltip, grouped in the Locale", () => {
    // Grouped by a narrow no-break space, the French way.
    expect(duelChartFigure(1284, "fr")).toBe("1 284");
    expect(duelChartFigure(1284, "en")).toBe("1,284");
  });
});
