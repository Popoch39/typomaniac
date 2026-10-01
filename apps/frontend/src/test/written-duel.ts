import type { ReplayedDuel, ReplayedPlayer, WrittenDuel } from "@/api/duel-history";

const writtenPlayer = ({ handle, image, pace, result }: ReplayedPlayer, roundsWon: number) => ({
  handle,
  image,
  pace,
  result,
  roundsWon,
});

const roundSide = ({ result, score, keystrokes }: ReplayedPlayer) => ({
  result,
  score,
  keystrokes,
});

// `duel` as the API sends it: a Duel of a single Round, the one it shows, won by its winner.
export const writtenDuelOf = ({
  me,
  opponent,
  seed,
  startsAt,
  endedAt,
  ...duel
}: ReplayedDuel): WrittenDuel => {
  const won = duel.forfeit ? 0 : 1;

  return {
    ...duel,
    startsAt,
    endedAt,
    roundsToWin: 1,
    me: writtenPlayer(me, duel.outcome === "win" ? won : 0),
    opponent: opponent && writtenPlayer(opponent, duel.outcome === "loss" ? won : 0),
    rounds: [
      {
        index: 0,
        seed,
        seconds: duel.seconds,
        startsAt,
        endedAt,
        me: roundSide(me),
        opponent: opponent && roundSide(opponent),
      },
    ],
  };
};
