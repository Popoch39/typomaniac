import { cn } from "cn";

import { signedTp } from "@/components/tier/rank-label";

// The TP a ranked Duel moved for the User, signed; nothing for a Challenge, a Duel in Placement or
// one played before the ranked.
export const DuelHistoryTp = ({ tp }: { tp: number | null }) =>
  tp === null ? null : (
    <span
      className={cn(
        "font-mono text-sm font-semibold tabular-nums",
        tp >= 0 ? "text-primary" : "text-muted-foreground",
      )}
    >
      {signedTp(tp)}
    </span>
  );
