import type { Rank } from "ranked";

import { rankLabel } from "@/components/tier/rank-label";
import { TierBadge } from "@/components/tier/tier-badge";

// A User's rank on their Profile: the badge once past Placement (its name already in the words),
// and the rank in words.
export const ProfileRank = ({ rank }: { rank: Rank }) => (
  <div className="ml-auto flex items-center gap-3">
    {"placementsLeft" in rank ? null : (
      <span aria-hidden>
        <TierBadge standing={rank} />
      </span>
    )}
    <p className="font-mono text-sm font-semibold tabular-nums">{rankLabel(rank)}</p>
  </div>
);
