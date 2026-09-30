import type { Rank } from "ranked";

import { LeaderboardAsideCard } from "@/components/leaderboard/leaderboard-aside-card";
import { LeaderboardPlaceLink } from "@/components/leaderboard/leaderboard-place-link";
import { LeaderboardPlacePending } from "@/components/leaderboard/leaderboard-place-pending";
import { LeaderboardPlaceRanked } from "@/components/leaderboard/leaderboard-place-ranked";
import type { ReaderPlace } from "@/components/leaderboard/reader-place";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type LeaderboardPlaceProps = {
  // Where the reader stands, null until they are in the Leaderboard.
  reader: ReaderPlace | null;
  // The reader's rank from `/me`, to tell a Placement from no Rating at all.
  rank: Rank | null;
};

// « Ta place »: where the reader stands in the Leaderboard, with the way to their page; or what
// they have left to get in.
export const LeaderboardPlace = ({ reader, rank }: LeaderboardPlaceProps) => {
  const locale = useLocale();

  return (
    <LeaderboardAsideCard
      title={m.leaderboard_place_title({}, { locale })}
      className="gap-4 px-5.5 pt-5.5 pb-6"
    >
      {reader === null ? (
        <LeaderboardPlacePending rank={rank} />
      ) : (
        <>
          <LeaderboardPlaceRanked reader={reader} />
          <LeaderboardPlaceLink />
        </>
      )}
    </LeaderboardAsideCard>
  );
};
