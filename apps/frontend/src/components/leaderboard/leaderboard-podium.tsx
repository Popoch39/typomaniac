import type { LeaderboardEntry } from "@/api/leaderboard";
import { LeaderboardPodiumPlace } from "@/components/leaderboard/leaderboard-podium-place";

// The column of each place on the podium, read in order: the first in the middle, the second at
// its left, the third at its right. A missing place leaves its column empty.
const PODIUM_COLUMNS = ["col-start-2", "col-start-1", "col-start-3"];

type LeaderboardPodiumProps = { entries: LeaderboardEntry[]; readerPosition: number | null };

// The first three of the Classement, each on their card, the first raised in the middle.
export const LeaderboardPodium = ({ entries, readerPosition }: LeaderboardPodiumProps) => (
  <ol aria-label="Podium" className="grid grid-cols-3 items-end gap-4">
    {entries.map((entry, index) => (
      <LeaderboardPodiumPlace
        key={entry.position}
        entry={entry}
        mine={entry.position === readerPosition}
        first={index === 0}
        className={PODIUM_COLUMNS[index] ?? ""}
      />
    ))}
  </ol>
);
