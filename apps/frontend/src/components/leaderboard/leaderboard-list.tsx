import type { LeaderboardEntry } from "@/api/leaderboard";
import { LeaderboardRow } from "@/components/leaderboard/leaderboard-row";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type LeaderboardListProps = {
  entries: LeaderboardEntry[];
  // The reader's Place, their line marked if it is among the entries.
  readerPlace: number | null;
};

// The page's rows past the podium, the reader's line among them.
export const LeaderboardList = ({ entries, readerPlace }: LeaderboardListProps) => {
  const locale = useLocale();

  return (
    <ol
      start={entries[0]?.place}
      aria-label={m.leaderboard_list_label({}, { locale })}
      className="flex flex-col gap-2"
    >
      {entries.map((entry) => (
        <LeaderboardRow key={entry.place} entry={entry} mine={entry.place === readerPlace} />
      ))}
    </ol>
  );
};
