import type { LeaderboardEntry } from "@/api/leaderboard";
import { LeaderboardList } from "@/components/leaderboard/leaderboard-list";
import { LeaderboardPodium } from "@/components/leaderboard/leaderboard-podium";

// How many of the first stand on the podium.
const PODIUM_PLACES = 3;

type LeaderboardStandingsProps = { entries: LeaderboardEntry[]; me: LeaderboardEntry | null };

// The Classement's first Users: the first three on the podium, the others in the list, the
// reader's line among them, or below the list when they stand further down.
export const LeaderboardStandings = ({ entries, me }: LeaderboardStandingsProps) => {
  const readerPosition = me?.position ?? null;
  const listed = entries.some((entry) => entry.position === readerPosition);
  const below = me !== null && !listed ? me : null;
  const podium = entries.slice(0, PODIUM_PLACES);
  const rest = entries.slice(PODIUM_PLACES);

  return (
    <>
      {podium.length > 0 ? (
        <LeaderboardPodium entries={podium} readerPosition={readerPosition} />
      ) : null}
      {rest.length > 0 || below !== null ? (
        <LeaderboardList entries={rest} readerPosition={readerPosition} below={below} />
      ) : null}
    </>
  );
};
