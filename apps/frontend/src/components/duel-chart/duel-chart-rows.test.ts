import { describe, expect, test } from "vitest";

import type { ReplayedDuel, ReplayedPlayer } from "@/api/duel-history";
import { duelChartRows } from "@/components/duel-chart/duel-chart-rows";

// Seed 42 in English, version 1, starts with "small".
const player = (keystrokes: ReplayedPlayer["keystrokes"]): ReplayedPlayer => ({
  handle: "ada",
  image: null,
  result: {
    wpm: 0,
    raw: 0,
    accuracy: 0,
    consistency: 0,
    chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
  },
  pace: null,
  score: null,
  keystrokes,
});

const duel = (overrides: Partial<ReplayedDuel>): ReplayedDuel => ({
  id: "duel-1",
  seed: 42,
  language: "en",
  wordListVersion: 1,
  seconds: 2,
  startsAt: 10_000,
  endedAt: 12_000,
  outcome: "win",
  forfeit: false,
  me: player([
    { kind: "char", char: "s", at: 100 },
    { kind: "char", char: "x", at: 1_100 },
  ]),
  opponent: player([]),
  ...overrides,
});

describe("duelChartRows", () => {
  test("both sides second by second, rounded; no Misses is no point", () => {
    expect(duelChartRows(duel({}))).toEqual([
      {
        second: 1,
        ownWpm: 12,
        ownRaw: 12,
        ownMisses: null,
        opponentWpm: 0,
        opponentRaw: 0,
        opponentMisses: null,
      },
      {
        second: 2,
        ownWpm: 6,
        ownRaw: 12,
        ownMisses: 1,
        opponentWpm: 0,
        opponentRaw: 0,
        opponentMisses: null,
      },
    ]);
  });

  test("a deleted opponent has no values", () => {
    expect(duelChartRows(duel({ opponent: null }))[0]).toMatchObject({
      opponentWpm: null,
      opponentRaw: null,
    });
  });

  test("a Forfeit stops the chart there", () => {
    expect(duelChartRows(duel({ forfeit: true, endedAt: 11_000 }))).toHaveLength(1);
  });
});
