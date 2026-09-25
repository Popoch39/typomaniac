import type { Rank } from "ranked";

import { rankLabel } from "@/components/tier/rank-label";
import { TierBadge } from "@/components/tier/tier-badge";

// A player's rank in the Face-off, never their MMR: the Tier's badge and the rank in words, the
// Placement Duels left, or the Challenge badge when the Duel is not ranked.
type FaceOffRankProps = { rank: Rank | null };

export const FaceOffRank = ({ rank }: FaceOffRankProps) => {
  if (rank === null) {
    return (
      <span className="rounded-full bg-surface-2 px-5 py-2 text-lg font-bold tracking-wide text-foreground uppercase">
        Challenge
      </span>
    );
  }

  if ("placementsLeft" in rank) {
    return <span className="text-xl font-semibold text-muted-foreground">{rankLabel(rank)}</span>;
  }

  return (
    <span className="flex items-center gap-4">
      {/* The label says the Tier and Division already: the badge's own name would repeat it. */}
      <span aria-hidden>
        <TierBadge standing={rank} size="lg" />
      </span>
      <span className="font-mono text-2xl font-semibold tabular-nums">{rankLabel(rank)}</span>
    </span>
  );
};
