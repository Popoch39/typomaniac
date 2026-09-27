import type { RunState } from "typing-engine";

import { RunText } from "@/components/run/run-text";
import { initials } from "@/lib/initials";

type DuelTextProps = {
  run: RunState;
  lastBurst: number | null;
  opponentRun: RunState;
  opponentHandle: string;
};

// The Duel's Text: this User's Run, the word of their last Burst highlighted, and the opponent's
// caret where their Run stands.
export const DuelText = ({ run, lastBurst, opponentRun, opponentHandle }: DuelTextProps) => (
  <RunText
    run={run}
    tone="own"
    other={{
      wordIndex: opponentRun.wordIndex,
      letterIndex: opponentRun.letterIndex,
      tone: "opponent",
      label: initials(opponentHandle),
    }}
    lastBurst={lastBurst}
  />
);
