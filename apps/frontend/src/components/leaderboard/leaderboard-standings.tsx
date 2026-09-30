import type { LeaderboardEntry } from "@/api/leaderboard";
import { LeaderboardList } from "@/components/leaderboard/leaderboard-list";
import { LeaderboardPodium } from "@/components/leaderboard/leaderboard-podium";

// How many of the first stand on the podium.
const PODIUM_PLACES = 3;

type LeaderboardStandingsProps = {
  entries: LeaderboardEntry[];
  // The Place of the page's first row: the podium is on the first page only.
  firstPlace: number;
  // The reader's Place, wherever it is.
  readerPlace: number | null;
};

// A page of the Leaderboard: on the first, the first three on the podium and the others in the
// list; on the others, the list alone. The reader's line is marked wherever it is on the page.
export const LeaderboardStandings = ({
  entries,
  firstPlace,
  readerPlace,
}: LeaderboardStandingsProps) => {
  const podium = firstPlace === 1 ? entries.slice(0, PODIUM_PLACES) : [];
  const rest = entries.slice(podium.length);

  return (
    <>
      {podium.length > 0 ? <LeaderboardPodium entries={podium} readerPlace={readerPlace} /> : null}
      {rest.length > 0 ? <LeaderboardList entries={rest} readerPlace={readerPlace} /> : null}
    </>
  );
};
