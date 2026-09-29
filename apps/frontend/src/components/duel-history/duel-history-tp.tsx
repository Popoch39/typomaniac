import { cn } from "cn";

import { duelKind } from "@/components/duel-history/duel-kind";
import { tpTone } from "@/components/duel-history/tp-tone";
import { signedTp } from "@/components/tier/rank/rank-label";

type DuelHistoryTpProps = { tp: number | null; ranked: boolean };

// Under the outcome of a Duel of the Duel history: the TP it moved for the User, signed, or
// « Challenge » when it was not Ranked. Nothing for a Duel in Placement, which moved no TP.
export const DuelHistoryTp = ({ tp, ranked }: DuelHistoryTpProps) => {
  if (tp !== null) {
    return (
      <span className={cn("font-mono text-xs font-semibold tabular-nums", tpTone(tp))}>
        {signedTp(tp)}
      </span>
    );
  }

  return ranked ? null : (
    <span className="text-xs font-semibold text-muted-foreground">{duelKind(false)}</span>
  );
};
