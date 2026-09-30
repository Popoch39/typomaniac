import type { Ref } from "react";

import type { Leaderboard } from "@/api/leaderboard";
import { LeaderboardPagination } from "@/components/leaderboard/leaderboard-pagination";
import { LeaderboardStandings } from "@/components/leaderboard/leaderboard-standings";

type LeaderboardShownPageProps = {
  ref: Ref<HTMLDivElement>;
  page: Leaderboard;
  // The reader's Place, their line marked if it is on the page.
  readerPlace: number | null;
};

// The page of the Leaderboard the URL names: its rows, then the way to the others when there are.
export const LeaderboardShownPage = ({ ref, page, readerPlace }: LeaderboardShownPageProps) => {
  const { entries, firstPlace, lastPlace, total, previous, next } = page;

  return (
    <div ref={ref} className="flex flex-col gap-5">
      <LeaderboardStandings entries={entries} firstPlace={firstPlace} readerPlace={readerPlace} />
      {previous !== null || next !== null ? (
        <LeaderboardPagination
          from={firstPlace}
          to={lastPlace}
          total={total}
          previous={previous}
          next={next}
        />
      ) : null}
    </div>
  );
};
