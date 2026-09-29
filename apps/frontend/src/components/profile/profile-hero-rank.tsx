import { isPlacement, type Rank } from "ranked";

import { ProfileHeroRankText } from "@/components/profile/profile-hero-rank-text";
import { rankedPlaceOf } from "@/components/ranked/ranked-place-of";
import { TierBadge } from "@/components/tier/rank/tier-badge";
import { TpProgress } from "@/components/tier/rank/tp-progress";

// The User's rank in the hero of `/profile`: its badge in its Blason once past Placement, the rank in
// words, then its progress. Nothing without a Rating.
export const ProfileHeroRank = ({ rank }: { rank: Rank | null }) => {
  if (rank === null) {
    return null;
  }

  return (
    <div className="relative flex shrink-0 items-center gap-4 px-3">
      {isPlacement(rank) ? null : (
        // The rank is written next to it: the badge's own name would be read twice.
        <span aria-hidden>
          <TierBadge standing={rank} size="lg" />
        </span>
      )}
      <div className="flex w-47.5 flex-col gap-1.5">
        <ProfileHeroRankText place={rankedPlaceOf(rank)} />
        <TpProgress rank={rank} size="md" />
      </div>
    </div>
  );
};
