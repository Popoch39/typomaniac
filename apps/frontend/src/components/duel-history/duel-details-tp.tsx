import { cn } from "cn";

import { tpTone } from "@/components/duel-history/tp-tone";
import { signedTp } from "@/components/tier/rank/rank-label";

// The TP the chosen Duel moved for the User, in a pill tinted like its figure. Nothing for a
// Challenge, a Duel in Placement or one played before the ranked.
export const DuelDetailsTp = ({ tp }: { tp: number | null }) =>
  tp === null ? null : (
    <span
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 font-mono text-sm font-semibold tabular-nums",
        tp >= 0 ? "bg-primary/16" : "bg-muted",
        tpTone(tp),
      )}
    >
      {signedTp(tp)}
    </span>
  );
