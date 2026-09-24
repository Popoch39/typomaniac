import type { Result } from "typing-engine";

import { RunResult } from "@/components/run/run-result";
import { cn } from "cn";

type PlayerResultProps = { name: string; result: Result; opponent?: boolean };

// One player's Result at the end of a Duel, under their name: the opponent's in their caret color.
export const PlayerResult = ({ name, result, opponent = false }: PlayerResultProps) => (
  <section className="flex flex-col gap-4">
    <h3 className={cn("text-xl font-bold", opponent && "text-opponent-caret")}>{name}</h3>
    <RunResult result={result} />
  </section>
);
