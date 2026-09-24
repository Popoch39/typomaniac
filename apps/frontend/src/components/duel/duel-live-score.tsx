import { PlayerLiveScore } from "@/components/duel/player-live-score";
import { duelOf, useDuelStore } from "@/stores/duel-store";

type DuelLiveScoreProps = { name: string; opponent?: boolean };

// One player's Score so far in the Duel being played: this User's, or the opponent's, rebuilt from
// the Keystrokes the server relays.
export const DuelLiveScore = ({ name, opponent = false }: DuelLiveScoreProps) => {
  const score = useDuelStore((store) => {
    const duel = duelOf(store.state);

    return opponent ? duel?.opponentScore : duel?.score;
  });

  if (typeof score === "undefined") {
    return null;
  }

  return <PlayerLiveScore name={name} score={score} opponent={opponent} />;
};
