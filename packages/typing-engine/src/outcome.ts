import type { Result } from "./result";

// Who wins a Duel, from the sides of its two players in the order they are given.
export type Outcome = "first" | "second" | "draw";

// What decides a Duel for one player: their Score, and their Result for the accuracy.
export type DuelSide = { result: Result; score: number };

// The best Score wins, then the best accuracy; otherwise a Draw.
export const duelOutcome = (first: DuelSide, second: DuelSide): Outcome => {
  const lead = first.score - second.score || first.result.accuracy - second.result.accuracy;

  if (lead > 0) {
    return "first";
  }

  return lead < 0 ? "second" : "draw";
};
