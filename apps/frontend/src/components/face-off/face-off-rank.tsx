import { cn } from "cn";
import type { Rank } from "ranked";

import { rankLabel } from "@/components/tier/rank-label";
import { TIER_COLORS } from "@/components/tier/tier";
import { TierEmblem } from "@/components/tier/tier-emblem";

// A player's rank in the Face-off, never their MMR, on an ink chip over their colour: the Tier's
// emblem and the rank in words, the Placement Duels left, or the Challenge badge when the Duel is
// not ranked.
type FaceOffRankProps = { rank: Rank | null };

const CHIP = "flex items-center gap-3 rounded-[1.125rem] bg-background py-2.5 pr-5 pl-3";

export const FaceOffRank = ({ rank }: FaceOffRankProps) => {
  if (rank === null) {
    return (
      <span className="rounded-full bg-background px-5.5 py-3 text-[0.9375rem] font-extrabold tracking-[0.12em] text-foreground uppercase">
        Challenge
      </span>
    );
  }

  if ("placementsLeft" in rank) {
    return (
      <span className={cn(CHIP, "pl-5 text-lg font-semibold text-muted-foreground")}>
        {rankLabel(rank)}
      </span>
    );
  }

  return (
    <span className={cn(CHIP, TIER_COLORS[rank.tier])}>
      {/* The label says the Tier and Division already: the emblem is only seen. */}
      <span aria-hidden className="size-11">
        <TierEmblem tier={rank.tier} />
      </span>
      <span className="font-mono text-lg font-semibold tabular-nums">{rankLabel(rank)}</span>
    </span>
  );
};
