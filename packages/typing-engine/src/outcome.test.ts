import { describe, expect, test } from "bun:test";

import {
  averageResult,
  duelOutcome,
  isDuelDecided,
  maxRounds,
  type Result,
  roundOutcome,
  type RoundSide,
  type RoundSides,
  roundsWon,
} from "./index";

const result = (accuracy: number, wpm = 60): Result => ({
  wpm,
  raw: 80,
  accuracy,
  consistency: 70,
  chars: { correct: 100, incorrect: 3, extra: 0, missed: 0 },
});

// Only the Score and the accuracy decide a Round: the rest of the Result stays the same.
const side = (score: number, accuracy: number, wpm = 60): RoundSide => ({
  score,
  result: result(accuracy, wpm),
});

// A Round the first player wins, one the second wins, and one nobody does.
const won = (): RoundSides => [side(300, 95), side(200, 95)];

const lost = (): RoundSides => [side(200, 95), side(300, 95)];

const drawn = (): RoundSides => [side(250, 95), side(250, 95)];

describe("roundOutcome", () => {
  test("the best Score wins, whatever the accuracy", () => {
    expect(roundOutcome(side(310, 90), side(290, 100))).toBe("first");
    expect(roundOutcome(side(290, 100), side(310, 90))).toBe("second");
  });

  test("the best Score wins over a better wpm", () => {
    expect(roundOutcome(side(420, 100, 55), side(380, 100, 70))).toBe("first");
    expect(roundOutcome(side(380, 100, 70), side(420, 100, 55))).toBe("second");
  });

  test("the same Score is decided by accuracy", () => {
    expect(roundOutcome(side(300, 97), side(300, 95))).toBe("first");
    expect(roundOutcome(side(300, 95), side(300, 97))).toBe("second");
  });

  test("the same Score and the same accuracy is a drawn Round, whatever the wpm", () => {
    expect(roundOutcome(side(300, 95, 62), side(300, 95, 58))).toBe("draw");
  });

  test("two players who typed nothing draw", () => {
    expect(roundOutcome(side(0, 0, 0), side(0, 0, 0))).toBe("draw");
  });
});

describe("roundsWon", () => {
  test("each player's won Rounds; a drawn Round counts for nobody", () => {
    expect(roundsWon([])).toEqual([0, 0]);
    expect(roundsWon([won(), drawn(), lost(), won()])).toEqual([2, 1]);
  });
});

describe("duelOutcome", () => {
  test("a Duel of one Round goes as its Round", () => {
    expect(duelOutcome([won()])).toBe("first");
    expect(duelOutcome([lost()])).toBe("second");
    expect(duelOutcome([drawn()])).toBe("draw");
  });

  test("the most Rounds won wins, whatever the Scores", () => {
    expect(duelOutcome([won(), [side(0, 50), side(900, 100)], won()])).toBe("first");
    expect(duelOutcome([lost(), drawn()])).toBe("second");
  });

  test("as many Rounds won: the cumulated Score decides", () => {
    expect(duelOutcome([won(), [side(100, 95), side(150, 95)], drawn()])).toBe("first");
    expect(duelOutcome([[side(100, 95), side(150, 95)], won(), drawn()])).toBe("first");
    expect(duelOutcome([[side(110, 95), side(100, 95)], lost(), drawn()])).toBe("second");
  });

  test("the same cumulated Score: the average accuracy decides", () => {
    expect(duelOutcome([won(), lost(), [side(250, 97), side(250, 95)]])).toBe("first");
    expect(duelOutcome([won(), lost(), [side(250, 90), side(250, 95)]])).toBe("second");
  });

  test("the same cumulated Score and the same average accuracy: a Draw", () => {
    expect(duelOutcome([won(), lost(), drawn()])).toBe("draw");
    expect(duelOutcome([drawn(), drawn(), drawn()])).toBe("draw");
  });
});

describe("maxRounds", () => {
  test("a Duel never needs more Rounds than both players one short of winning, and one", () => {
    expect(maxRounds(1)).toBe(1);
    expect(maxRounds(2)).toBe(3);
  });
});

describe("isDuelDecided", () => {
  test("a Duel of one Round to win is decided by its Round, even a drawn one", () => {
    expect(isDuelDecided([], 1)).toBe(false);
    expect(isDuelDecided([won()], 1)).toBe(true);
    expect(isDuelDecided([drawn()], 1)).toBe(true);
  });

  test("a Bo3 is decided at two Rounds won by either player", () => {
    expect(isDuelDecided([won()], 2)).toBe(false);
    expect(isDuelDecided([won(), lost()], 2)).toBe(false);
    expect(isDuelDecided([won(), won()], 2)).toBe(true);
    expect(isDuelDecided([lost(), drawn(), lost()], 2)).toBe(true);
  });

  test("a Bo3 is decided once its third Round is played, whoever won it", () => {
    expect(isDuelDecided([won(), drawn()], 2)).toBe(false);
    expect(isDuelDecided([won(), lost(), drawn()], 2)).toBe(true);
    expect(isDuelDecided([drawn(), drawn(), drawn()], 2)).toBe(true);
  });
});

describe("averageResult", () => {
  test("the Result of one Round is the Duel's", () => {
    expect(averageResult([result(95)])).toEqual(result(95));
  });

  test("the rates are averaged over the Rounds, the chars added up", () => {
    const first: Result = {
      wpm: 60,
      raw: 70,
      accuracy: 90,
      consistency: 60,
      chars: { correct: 100, incorrect: 4, extra: 1, missed: 0 },
    };

    const second: Result = {
      wpm: 80,
      raw: 90,
      accuracy: 100,
      consistency: 80,
      chars: { correct: 140, incorrect: 0, extra: 0, missed: 2 },
    };

    expect(averageResult([first, second])).toEqual({
      wpm: 70,
      raw: 80,
      accuracy: 95,
      consistency: 70,
      chars: { correct: 240, incorrect: 4, extra: 1, missed: 2 },
    });
  });
});
