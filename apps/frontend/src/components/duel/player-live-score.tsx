import type { ScoreState } from "typing-engine";

import { ScoreStats } from "@/components/run/score-stats";
import { cn } from "cn";

type PlayerLiveScoreProps = { name: string; score: ScoreState; opponent?: boolean };

// One player's Score so far in a Duel, under their name: the opponent's in their caret color.
export const PlayerLiveScore = ({ name, score, opponent = false }: PlayerLiveScoreProps) => (
  <section aria-label={`Score de ${name}`} className="flex flex-col gap-1">
    <h3 className={cn("text-sm font-bold", opponent && "text-opponent-caret")}>{name}</h3>
    <ScoreStats score={score} tone={opponent ? "opponent" : "own"} />
  </section>
);
