import type { LeaderboardEntry } from "@/api/leaderboard";
import { LeaderboardRow } from "@/components/leaderboard/leaderboard-row";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type LeaderboardListProps = {
  entries: LeaderboardEntry[];
  // The place of the reader, if it is among the entries.
  readerPosition: number | null;
  // The reader's line when they stand further down than the entries, after a gap.
  below: LeaderboardEntry | null;
};

// The Classement past the podium, from the 4th, the reader's line among them or below the list.
export const LeaderboardList = ({ entries, readerPosition, below }: LeaderboardListProps) => {
  const locale = useLocale();

  return (
    <ol
      start={entries[0]?.position}
      aria-label={m.leaderboard_list_label({}, { locale })}
      className="flex flex-col gap-2"
    >
      {entries.map((entry) => (
        <LeaderboardRow
          key={entry.position}
          entry={entry}
          mine={entry.position === readerPosition}
        />
      ))}
      {below === null ? null : (
        <>
          <li
            aria-hidden
            className="flex h-4.5 items-center justify-center tracking-[6px] text-faint"
          >
            ···
          </li>
          <LeaderboardRow entry={below} mine />
        </>
      )}
    </ol>
  );
};
