import { useSuspenseQuery } from "@tanstack/react-query";
import type { Rank } from "ranked";

import { leaderboardQueryOptions } from "@/api/leaderboard";
import { LeaderboardColumns } from "@/components/leaderboard/leaderboard-columns";
import { LeaderboardEmpty } from "@/components/leaderboard/leaderboard-empty";
import { LeaderboardPlace } from "@/components/leaderboard/leaderboard-place";
import { LeaderboardStandings } from "@/components/leaderboard/leaderboard-standings";
import { readerPlace } from "@/components/leaderboard/reader-place";
import { TierLegend } from "@/components/leaderboard/tier-legend";

// The Classement for a signed-in reader, their rank from `/me`: its standings at the left; at the
// right, where the reader stands and the Tiers.
export const LeaderboardBoard = ({ rank }: { rank: Rank | null }) => {
  const { data } = useSuspenseQuery(leaderboardQueryOptions);
  const { entries, me } = data;
  const reader = readerPlace(me, rank);

  return (
    <LeaderboardColumns
      standings={
        entries.length === 0 && me === null ? (
          <LeaderboardEmpty />
        ) : (
          <LeaderboardStandings entries={entries} me={me} />
        )
      }
      aside={
        <>
          <LeaderboardPlace reader={reader} rank={rank} />
          <TierLegend tier={reader?.standing.tier ?? null} />
        </>
      }
    />
  );
};
