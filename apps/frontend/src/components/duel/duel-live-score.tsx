import { ScoreStats } from "@/components/run/score-stats";
import { duelOf, useDuelStore } from "@/stores/duel-store";
import { cn } from "cn";

type DuelLiveScoreProps = { name: string; opponent?: boolean };

// One player's Score so far, under their name: this User's, or the opponent's in their caret
// color, rebuilt from the Keystrokes the server relays.
export const DuelLiveScore = ({ name, opponent = false }: DuelLiveScoreProps) => {
  const score = useDuelStore((store) => {
    const duel = duelOf(store.state);

    return opponent ? duel?.opponentScore : duel?.score;
  });

  if (typeof score === "undefined") {
    return null;
  }

  return (
    <section aria-label={`Score de ${name}`} className="flex flex-col gap-1">
      <h3 className={cn("text-sm font-bold", opponent && "text-opponent-caret")}>{name}</h3>
      <ScoreStats score={score} tone={opponent ? "opponent" : "own"} />
    </section>
  );
};
