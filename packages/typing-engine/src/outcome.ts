import type { Result } from "./result";

// Who wins a Duel, from the Results of its two players in the order they are given.
export type Outcome = "first" | "second" | "draw";

// The best wpm wins, then the best accuracy; otherwise a Draw. The Score will replace this.
export const duelOutcome = (first: Result, second: Result): Outcome => {
  const lead = first.wpm - second.wpm || first.accuracy - second.accuracy;

  if (lead > 0) {
    return "first";
  }

  return lead < 0 ? "second" : "draw";
};
