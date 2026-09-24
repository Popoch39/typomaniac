import type { Result } from "typing-engine";

import { NextRunButton } from "@/components/run/next-run-button";
import { ReplayButton } from "@/components/run/replay-button";
import { RunResult } from "@/components/run/run-result";
import { ScoreResult } from "@/components/run/score-result";
import { useRunStore } from "@/stores/run-store";

// Called once with the node on mount. The typing input is gone with the Run, and the focus would
// fall back to the page, where Tab reaches the header first.
const focusOnMount = (node: HTMLElement | null) => node?.focus();

// The Result of the finished Run, then what to play next. It takes the focus so that Tab reaches
// Suivant, the first button after it.
export const ResultScreen = ({ result }: { result: Result }) => {
  const score = useRunStore((state) => state.score);

  return (
    <div ref={focusOnMount} tabIndex={-1} className="flex flex-col gap-8 outline-none">
      <ScoreResult score={score} />
      <RunResult result={result} />
      <div className="flex gap-2">
        <NextRunButton />
        <ReplayButton />
      </div>
    </div>
  );
};
