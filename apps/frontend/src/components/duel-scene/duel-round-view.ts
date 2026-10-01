import { maxRounds } from "typing-engine";

import type { DuelPlay } from "@/stores/duel-store";

// A Round of the Bo3 for one player: its number from 1, and whether they won it.
export type RoundPip = { round: number; won: boolean };

// Where a Bo3 stands, as the Duel's scene shows it beside its format: the Round being played, from
// 1, the Rounds won by each, and for each player a pip per Round, filled for the Rounds they won.
export type DuelRoundView = {
  number: number;
  roundsWon: number;
  opponentRoundsWon: number;
  self: readonly RoundPip[];
  opponent: readonly RoundPip[];
};

// The Duel's Rounds as the scene shows them: none for a Duel of a single Round (a Challenge).
export const duelRoundView = ({
  roundsToWin,
  roundIndex,
  rounds,
  roundsWon,
  opponentRoundsWon,
}: Pick<
  DuelPlay,
  "roundsToWin" | "roundIndex" | "rounds" | "roundsWon" | "opponentRoundsWon"
>): DuelRoundView | null => {
  if (roundsToWin <= 1) {
    return null;
  }

  const outcomes = Array.from({ length: maxRounds(roundsToWin) }, (_, index) => ({
    round: index + 1,
    outcome: rounds.find((played) => played.index === index)?.outcome ?? null,
  }));

  return {
    number: roundIndex + 1,
    roundsWon,
    opponentRoundsWon,
    self: outcomes.map(({ round, outcome }) => ({ round, won: outcome === "win" })),
    opponent: outcomes.map(({ round, outcome }) => ({ round, won: outcome === "loss" })),
  };
};
