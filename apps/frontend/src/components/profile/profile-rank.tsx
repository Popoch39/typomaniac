import type { Rank } from "ranked";

import { rankLabel } from "@/components/tier/rank/rank-label";
import { TierBadge } from "@/components/tier/rank/tier-badge";
import { TpProgress } from "@/components/tier/rank/tp-progress";

// A User's rank on their Profile: the badge in its Blason once past Placement (its name already
// in the words), the rank in words, and its progress under it.
export const ProfileRank = ({ rank }: { rank: Rank }) => (
  <div className="relative ml-auto flex items-center gap-4">
    {"placementsLeft" in rank ? null : (
      <span aria-hidden>
        <TierBadge standing={rank} size="lg" />
      </span>
    )}
    <div className="flex w-47.5 flex-col gap-2">
      <p className="font-mono text-sm font-semibold tabular-nums">{rankLabel(rank)}</p>
      <TpProgress rank={rank} size="md" />
    </div>
  </div>
);
