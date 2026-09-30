import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "@tanstack/react-router";
import type { Rank } from "ranked";
import { useRef } from "react";

import { leaderboardQueryOptions } from "@/api/leaderboard";
import { LeaderboardColumns } from "@/components/leaderboard/leaderboard-columns";
import { LeaderboardEmpty } from "@/components/leaderboard/leaderboard-empty";
import { LeaderboardPlace } from "@/components/leaderboard/leaderboard-place";
import { LeaderboardReaderInView } from "@/components/leaderboard/leaderboard-reader-in-view";
import { LeaderboardShownPage } from "@/components/leaderboard/leaderboard-shown-page";
import { readerPlace } from "@/components/leaderboard/reader-place";
import { TierLegend } from "@/components/leaderboard/tier-legend";

// The Leaderboard for a signed-in reader, their rank from `/me`: the page the URL names at the
// left; at the right, where the reader stands and the Tiers.
export const LeaderboardBoard = ({ rank }: { rank: Rank | null }) => {
  const search = useSearch({ from: "/leaderboard" });
  // Each navigation has its own key: a second click on « Ta place » brings the line back.
  const navigation = useLocation({ select: (location) => location.state.key });
  const { data } = useSuspenseQuery(leaderboardQueryOptions(search));
  const reader = readerPlace(data.me, rank);
  const standings = useRef<HTMLDivElement>(null);

  return (
    <>
      <LeaderboardColumns
        standings={
          data.total === 0 ? (
            <LeaderboardEmpty />
          ) : (
            <LeaderboardShownPage ref={standings} page={data} readerPlace={reader?.place ?? null} />
          )
        }
        aside={
          <>
            <LeaderboardPlace reader={reader} rank={rank} />
            <TierLegend tier={reader?.standing.tier ?? null} />
          </>
        }
      />
      {search.at === "me" ? (
        <LeaderboardReaderInView key={navigation} standings={standings} />
      ) : null}
    </>
  );
};
