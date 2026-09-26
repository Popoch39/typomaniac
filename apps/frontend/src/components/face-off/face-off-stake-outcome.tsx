import { cn } from "cn";
import type { ReactNode } from "react";

import { signedTp } from "@/components/tier/rank-label";

type FaceOffStakeOutcomeProps = { label: string; tp: number; children?: ReactNode };

// One outcome of the Stake: « Victoire +20 TP » in green, « Défaite −20 TP » in red, as the TP of
// the end of a Duel, then what it leads to.
export const FaceOffStakeOutcome = ({ label, tp, children }: FaceOffStakeOutcomeProps) => (
  <span>
    {label}{" "}
    <span
      className={cn(
        "font-mono text-[0.8125rem] font-semibold tabular-nums",
        tp > 0 ? "text-win" : "text-destructive",
      )}
    >
      {signedTp(tp)}
    </span>
    {children}
  </span>
);
