import { cn } from "cn";
import type { Rank } from "ranked";

import { rankLabel } from "@/components/tier/rank-label";
import { standingName, TIER_COLORS } from "@/components/tier/tier";
import { TierEmblem } from "@/components/tier/tier-emblem";

// A player's rank under their name, never their MMR: the Tier's emblem, its name in its colour
// and the TP, or the Placement Duels left. Nothing when their Rating could not be read.
export const MatchProposalRank = ({ rank }: { rank: Rank | null }) => {
  if (rank === null) {
    return null;
  }

  if ("placementsLeft" in rank) {
    return <span className="text-sm text-muted-foreground">{rankLabel(rank)}</span>;
  }

  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span aria-hidden className={cn("size-4.5", TIER_COLORS[rank.tier])}>
        <TierEmblem tier={rank.tier} />
      </span>
      <span>
        <span className={cn("font-semibold", TIER_COLORS[rank.tier])}>{standingName(rank)}</span>
        {" · "}
        <span className="font-mono text-xs tabular-nums">{rank.tp} TP</span>
      </span>
    </span>
  );
};
