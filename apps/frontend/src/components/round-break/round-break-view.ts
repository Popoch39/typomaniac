import { maxRounds } from "typing-engine";

import type { DuelPlay, NextRound, PlayedRound } from "@/stores/duel-store";

// Where a Round's card stands in the Round break: played before the last one (shown turned),
// the one just played (it turns now), the next one (it lifts and carries the 3-2-1), or one after
// it, not sure to be played.
export type RoundCardState = "done" | "flip" | "next" | "later";

// Who took a played Round, as its card shows it: the colour of its winner, or neutral.
export type RoundWinner = "self" | "opponent" | "draw";

// A played Round on its card: its winner, the winner's Score on top, the other's under it, and
// the gap between them (0 for a drawn Round, which shows none).
export type PlayedCard = { winner: RoundWinner; top: number; bottom: number; gap: number };

// What the foot of an unplayed card says: the next Round, to play or deciding; or a later one,
// played only if needed.
export type CardFoot = "to-play" | "deciding" | "if-needed";

export type RoundCard = {
  index: number;
  state: RoundCardState;
  played: PlayedCard | null;
  foot: CardFoot | null;
};

// The count of the Rounds won, before and after the Round just played: the winner's figure jumps.
export type RoundCount = {
  self: number;
  opponent: number;
  // Whose figure jumps; null after a drawn Round, which moves neither.
  jumps: "self" | "opponent" | null;
};

export type RoundBreakView = {
  cards: RoundCard[];
  count: RoundCount;
  // The next Round, from 1, and whether it decides the Duel: both one Round away, the last one.
  nextNumber: number;
  deciding: boolean;
};

const WINNERS = { win: "self", loss: "opponent", draw: "draw" } as const;

const playedCardOf = ({ outcome, score, opponentScore }: PlayedRound): PlayedCard => {
  const winner = WINNERS[outcome];

  const [top, bottom] =
    winner === "opponent" ? [opponentScore.score, score.score] : [score.score, opponentScore.score];

  return { winner, top, bottom, gap: top - bottom };
};

const stateOf = (index: number, next: number): RoundCardState => {
  if (index < next - 1) {
    return "done";
  }

  if (index === next - 1) {
    return "flip";
  }

  return index === next ? "next" : "later";
};

// The Round break before the Round `next`, from the Duel as it stands: its Rounds played and won.
export const roundBreakView = (
  {
    rounds,
    roundsWon,
    opponentRoundsWon,
    roundsToWin,
  }: Pick<DuelPlay, "rounds" | "roundsWon" | "opponentRoundsWon" | "roundsToWin">,
  next: NextRound,
): RoundBreakView => {
  const last = maxRounds(roundsToWin) - 1;

  const deciding =
    next.index === last && roundsWon === roundsToWin - 1 && opponentRoundsWon === roundsToWin - 1;

  const cards = Array.from({ length: last + 1 }, (_, index): RoundCard => {
    const state = stateOf(index, next.index);
    const round = rounds.find((played) => played.index === index);
    const played = round === undefined ? null : playedCardOf(round);

    if (state === "next") {
      return { index, state, played, foot: deciding ? "deciding" : "to-play" };
    }

    return { index, state, played, foot: state === "later" ? "if-needed" : null };
  });

  const justPlayed = rounds.find((played) => played.index === next.index - 1);
  const winner = justPlayed === undefined ? "draw" : WINNERS[justPlayed.outcome];

  return {
    cards,
    count: {
      self: roundsWon,
      opponent: opponentRoundsWon,
      jumps: winner === "draw" ? null : winner,
    },
    nextNumber: next.index + 1,
    deciding,
  };
};
