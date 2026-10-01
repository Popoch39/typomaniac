import { describe, expect, test } from "vitest";

import { roundBreakView } from "@/components/round-break/round-break-view";
import type { DuelPlay, PlayedRound } from "@/stores/duel-store";

const noResult = {
  wpm: 0,
  raw: 0,
  accuracy: 0,
  consistency: 0,
  chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
};

const played = (
  index: number,
  outcome: PlayedRound["outcome"],
  score: number,
  opponentScore: number,
): PlayedRound => ({
  index,
  outcome,
  result: noResult,
  opponentResult: noResult,
  score: { score, bestCombo: 0, bursts: 0 },
  opponentScore: { score: opponentScore, bestCombo: 0, bursts: 0 },
});

// The Duel as the Round break reads it: its Rounds and counts.
const duel = (
  rounds: PlayedRound[],
  roundsWon: number,
  opponentRoundsWon: number,
): Pick<DuelPlay, "rounds" | "roundsWon" | "opponentRoundsWon" | "roundsToWin"> => ({
  rounds,
  roundsWon,
  opponentRoundsWon,
  roundsToWin: 2,
});

const next = (index: number) => ({ index, seed: 7, startsAt: 0 });

describe("the Round break's view", () => {
  test("after a first Round won: its card turns to this User, the second to play, the third if needed", () => {
    const view = roundBreakView(duel([played(0, "win", 1284, 1102)], 1, 0), next(1));

    expect(view.cards).toEqual([
      {
        index: 0,
        state: "flip",
        played: { winner: "self", top: 1284, bottom: 1102, gap: 182 },
        foot: null,
      },
      { index: 1, state: "next", played: null, foot: "to-play" },
      { index: 2, state: "later", played: null, foot: "if-needed" },
    ]);
    expect(view.count).toEqual({ self: 1, opponent: 0, jumps: "self" });
    expect(view).toMatchObject({ nextNumber: 2, deciding: false });
  });

  test("a Round lost shows the opponent's Score on top, and their figure jumps", () => {
    const view = roundBreakView(duel([played(0, "loss", 1047, 1216)], 0, 1), next(1));

    expect(view.cards[0]?.played).toEqual({
      winner: "opponent",
      top: 1216,
      bottom: 1047,
      gap: 169,
    });
    expect(view.count.jumps).toBe("opponent");
  });

  test("a drawn Round is neutral, without a gap, and moves no figure", () => {
    const view = roundBreakView(duel([played(0, "draw", 640, 640)], 0, 0), next(1));

    expect(view.cards[0]?.played).toEqual({ winner: "draw", top: 640, bottom: 640, gap: 0 });
    expect(view.count).toEqual({ self: 0, opponent: 0, jumps: null });
  });

  test("at 1-1, the third Round decides: its card and the caption say so", () => {
    const view = roundBreakView(
      duel([played(0, "loss", 1047, 1216), played(1, "win", 1309, 1158)], 1, 1),
      next(2),
    );

    expect(view.cards.map(({ state }) => state)).toEqual(["done", "flip", "next"]);
    expect(view.cards[2]?.foot).toBe("deciding");
    expect(view).toMatchObject({ nextNumber: 3, deciding: true });
  });

  test("a third Round after a drawn one is deciding on its card, but not the 1-1 of the caption", () => {
    const view = roundBreakView(
      duel([played(0, "win", 500, 400), played(1, "draw", 300, 300)], 1, 0),
      next(2),
    );

    expect(view.cards[2]?.foot).toBe("deciding");
    expect(view.deciding).toBe(false);
  });

  test("after a drawn first Round, the third is sure to be played: deciding, never if needed", () => {
    const view = roundBreakView(duel([played(0, "draw", 640, 640)], 0, 0), next(1));

    expect(view.cards[1]?.foot).toBe("to-play");
    expect(view.cards[2]?.foot).toBe("deciding");
  });
});
