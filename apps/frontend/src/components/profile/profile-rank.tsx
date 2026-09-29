import type { Rank } from "ranked";

import { ProfileRankBlason } from "@/components/profile/profile-rank-blason";
import { rankLabel } from "@/components/tier/rank/rank-label";
import { TpProgress } from "@/components/tier/rank/tp-progress";

// A User's rank on their Profile: the badge in its Blason once past Placement, the rank in words,
// and its progress under it.
export const ProfileRank = ({ rank }: { rank: Rank }) => (
  <div className="relative ml-auto flex items-center gap-4">
    <ProfileRankBlason rank={rank} />
    <div className="flex w-47.5 flex-col gap-2">
      <p className="font-mono text-sm font-semibold tabular-nums">{rankLabel(rank)}</p>
      <TpProgress rank={rank} size="md" />
    </div>
  </div>
);
