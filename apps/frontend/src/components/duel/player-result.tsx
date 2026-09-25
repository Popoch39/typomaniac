import type { Result } from "typing-engine";

import { RunResult } from "@/components/run/run-result";
import { ScoreResult } from "@/components/run/score-result";
import type { DuelEnding } from "@/stores/duel-store";
import { cn } from "cn";

type PlayerResultProps = {
  name: string;
  result: Result;
  // Null for a Duel played before the Score, in its Replay.
  score: DuelEnding["score"] | null;
  opponent?: boolean;
};

// One player's Score and Result at the end of a Duel, under their name: the opponent's in their
// caret color.
export const PlayerResult = ({ name, result, score, opponent = false }: PlayerResultProps) => (
  <section aria-label={name} className="flex flex-col gap-4 rounded-card bg-card p-8">
    <h3 className={cn("text-xl font-bold", opponent && "text-opponent-caret")}>{name}</h3>
    <ScoreResult score={score} />
    <RunResult result={result} />
  </section>
);
