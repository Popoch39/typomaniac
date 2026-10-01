import type { ServerMessage } from "api";

type DuelEnded = Extract<ServerMessage, { type: "duel-ended" }>;

type DuelResumed = Extract<ServerMessage, { type: "duel-resumed" }>;

// The Rounds of a Duel of a single Round as `duel-ended` tells them, when a test does not look at
// them: its Results alone stand for it.
export const singleRoundEnd: Pick<
  DuelEnded,
  "roundsToWin" | "rounds" | "roundsWon" | "opponentRoundsWon"
> = { roundsToWin: 1, rounds: [], roundsWon: 0, opponentRoundsWon: 0 };

// A Duel resumed in its first Round: nothing played before it, the Round on the Duel's own Seed and
// start.
export const inFirstRound = ({
  seed,
  startsAt,
}: {
  seed: number;
  startsAt: number;
}): Pick<DuelResumed, "rounds" | "roundsWon" | "opponentRoundsWon" | "round"> => ({
  rounds: [],
  roundsWon: 0,
  opponentRoundsWon: 0,
  round: { index: 0, seed, startsAt },
});
