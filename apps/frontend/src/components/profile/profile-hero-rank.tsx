import type { Rank } from "ranked";

import { ProfileHeroRankText } from "@/components/profile/profile-hero-rank-text";
import { ProfileRankBlason } from "@/components/profile/profile-rank-blason";
import { rankedPlaceOf } from "@/components/ranked/ranked-place-of";
import { TpProgress } from "@/components/tier/rank/tp-progress";
import { useLocale } from "@/locale/use-locale";

// The User's rank in the hero of `/profile`: its badge in its Blason once past Placement, the rank in
// words, then its progress. Nothing without a Rating.
export const ProfileHeroRank = ({ rank }: { rank: Rank | null }) => {
  const locale = useLocale();

  if (rank === null) {
    return null;
  }

  return (
    <div className="relative flex shrink-0 items-center gap-4 px-3">
      <ProfileRankBlason rank={rank} />
      <div className="flex w-47.5 flex-col gap-1.5">
        <ProfileHeroRankText place={rankedPlaceOf(rank, locale)} />
        <TpProgress rank={rank} size="md" />
      </div>
    </div>
  );
};
