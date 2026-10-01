import type { Result } from "./result";

// Who wins a Round or a Duel, from the sides of its two players in the order they are given.
export type Outcome = "first" | "second" | "draw";

// What decides a Round for one player: their Score, and their Result for the accuracy.
export type RoundSide = { result: Result; score: number };

// A played Round: the first player's side, then the second's.
export type RoundSides = readonly [RoundSide, RoundSide];

// Positive when the first player leads, negative when the second does, 0 for neither.
const outcomeOf = (lead: number): Outcome => {
  if (lead > 0) {
    return "first";
  }

  return lead < 0 ? "second" : "draw";
};

// The best Score wins, then the best accuracy; otherwise nobody does: a drawn Round.
export const roundOutcome = (first: RoundSide, second: RoundSide): Outcome =>
  outcomeOf(first.score - second.score || first.result.accuracy - second.result.accuracy);

// How many Rounds each player won, the first player's then the second's: a drawn Round counts for
// nobody.
export const roundsWon = (rounds: readonly RoundSides[]): [number, number] => {
  const won: [number, number] = [0, 0];

  for (const [first, second] of rounds) {
    const outcome = roundOutcome(first, second);

    if (outcome === "first") {
      won[0]++;
    } else if (outcome === "second") {
      won[1]++;
    }
  }

  return won;
};

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

// How much more the first player has of `of` over the Rounds than the second.
const leadOver = (rounds: readonly RoundSides[], of: (side: RoundSide) => number) =>
  sum(rounds.map(([first, second]) => of(first) - of(second)));

// The most Rounds won wins the Duel, then the cumulated Score, then the average accuracy (both
// played the same Rounds: the sum tells the same as the average); otherwise a Draw.
export const duelOutcome = (rounds: readonly RoundSides[]): Outcome => {
  const [first, second] = roundsWon(rounds);

  return outcomeOf(
    first - second ||
      leadOver(rounds, (side) => side.score) ||
      leadOver(rounds, (side) => side.result.accuracy),
  );
};

// The most Rounds a Duel plays to `roundsToWin`: both players one Round short, and the one that
// decides. Three for a Bo3, one for a Duel of a single Round.
export const maxRounds = (roundsToWin: number) => 2 * roundsToWin - 1;

// A player has won `roundsToWin` Rounds, or the last Round the Duel plays is played.
export const isDuelDecided = (rounds: readonly RoundSides[], roundsToWin: number) =>
  rounds.length >= maxRounds(roundsToWin) || roundsWon(rounds).some((won) => won >= roundsToWin);

const average = (values: readonly number[]) => sum(values) / values.length;

// The Result of a Duel over its Rounds: its rates averaged over them, its chars added up.
export const averageResult = (results: readonly [Result, ...Result[]]): Result => {
  const total = (of: (result: Result) => number) => sum(results.map(of));
  const mean = (of: (result: Result) => number) => average(results.map(of));

  return {
    wpm: mean((result) => result.wpm),
    raw: mean((result) => result.raw),
    accuracy: mean((result) => result.accuracy),
    consistency: mean((result) => result.consistency),
    chars: {
      correct: total((result) => result.chars.correct),
      incorrect: total((result) => result.chars.incorrect),
      extra: total((result) => result.chars.extra),
      missed: total((result) => result.chars.missed),
    },
  };
};
