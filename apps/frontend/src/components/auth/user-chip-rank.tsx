import { cn } from "cn";
import type { Rank } from "ranked";

import { rankLabel } from "@/components/tier/rank-label";
import { TIER_COLORS } from "@/components/tier/tier";
import { TierEmblem } from "@/components/tier/tier-emblem";

// The User's rank in the nav chip: the Tier's emblem and the rank in words, or the Placement
// Duels left.
export const UserChipRank = ({ rank }: { rank: Rank }) =>
  "placementsLeft" in rank ? (
    <span className="text-xs font-semibold text-muted-foreground">{rankLabel(rank)}</span>
  ) : (
    <span className={cn("flex items-center gap-1 text-xs font-semibold", TIER_COLORS[rank.tier])}>
      <span className="size-4" aria-hidden>
        <TierEmblem tier={rank.tier} />
      </span>
      {rankLabel(rank)}
    </span>
  );
