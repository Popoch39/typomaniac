import type { DuelEnding, PlayedRound } from "@/stores/duel-store";

// A Duel end that tells a series: a Ranked Duel, played in a Bo3. A Duel of a single Round (a
// Challenge) keeps the screen of its Scores.
export const isSeries = ({ roundsToWin }: Pick<DuelEnding, "roundsToWin">) => roundsToWin > 1;

type Side = Pick<DuelEnding, "result" | "score">;

const mine = ({ result, score }: PlayedRound): Side => ({ result, score });

const theirs = ({ opponentResult, opponentScore }: PlayedRound): Side => ({
  result: opponentResult,
  score: opponentScore,
});

const most = (values: readonly number[]) => Math.max(...values);

// One player's figures over the Rounds `sides`: their Result as the server averaged it (`over`),
// their best Combo and every Burst of the series; their Score, the best of a Round. Without a
// Round told, `over` as it is.
const acrossRounds = (sides: readonly Side[], over: Side): Side => {
  if (sides.length === 0) {
    return over;
  }

  return {
    result: over.result,
    score: {
      score: most(sides.map(({ score }) => score.score)),
      bestCombo: most(sides.map(({ score }) => score.bestCombo)),
      bursts: sides.reduce((total, { score }) => total + score.bursts, 0),
    },
  };
};

// What beats a Record: the best Round, never the Duel's average (a Record is set on a Round).
export const bestRoundFigures = ({
  rounds,
  result,
  score,
}: Pick<DuelEnding, "rounds" | "result" | "score">): Side => {
  if (rounds.length === 0) {
    return { result, score };
  }

  return {
    result: { ...result, wpm: most(rounds.map((round) => round.result.wpm)) },
    score: acrossRounds(rounds.map(mine), { result, score }).score,
  };
};

// Both players' figures of the tale of the tape: over the series, each Result averaged by the
// server, the best Combo of any Round and all its Bursts.
export const tapeSides = (ending: DuelEnding) => ({
  mine: acrossRounds(ending.rounds.map(mine), { result: ending.result, score: ending.score }),
  theirs: acrossRounds(ending.rounds.map(theirs), {
    result: ending.opponentResult,
    score: ending.opponentScore,
  }),
});
