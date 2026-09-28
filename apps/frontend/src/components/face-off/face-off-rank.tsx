import type { Rank } from "ranked";

import { TierEmblem } from "@/components/tier/drawing/tier-emblem";
import { rankLabel } from "@/components/tier/rank/rank-label";

// A player's rank in the Face-off, never their MMR, in ink right on their colour: the Tier's
// emblem and the rank in words, the Placement Duels left, or « Challenge » when the Duel is not
// ranked.
type FaceOffRankProps = { rank: Rank | null };

export const FaceOffRank = ({ rank }: FaceOffRankProps) => {
  if (rank === null) {
    return <span className="text-lg font-extrabold">Challenge</span>;
  }

  if ("placementsLeft" in rank) {
    return <span className="text-lg font-semibold">{rankLabel(rank)}</span>;
  }

  return (
    <span className="flex items-center gap-2">
      {/* The label says the Tier and Division already: the emblem is only seen. */}
      <span aria-hidden className="size-7">
        <TierEmblem tier={rank.tier} />
      </span>
      <span className="font-mono text-lg font-semibold tabular-nums">{rankLabel(rank)}</span>
    </span>
  );
};
