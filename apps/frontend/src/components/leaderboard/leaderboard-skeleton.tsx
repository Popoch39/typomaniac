import { LeaderboardColumns } from "@/components/leaderboard/leaderboard-columns";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Stable keys for the placeholders (they have no identity of their own): the podium's cards,
// second, first and third, the first raised; then the list's rows.
const PODIUM_CARDS = [
  { key: "second", height: "h-62.5" },
  { key: "first", height: "h-81" },
  { key: "third", height: "h-62.5" },
];

const ROW_KEYS = ["a", "b", "c", "d", "e"];

// The Classement while it loads: the podium, the list's rows (place, avatar, Handle, rank), then
// the right column's cards.
export const LeaderboardSkeleton = () => {
  const locale = useLocale();

  return (
    <LoadingRegion label={m.leaderboard_loading({}, { locale })}>
      <LeaderboardColumns
        standings={
          <>
            <div className="grid grid-cols-3 items-end gap-4">
              {PODIUM_CARDS.map((card) => (
                <Skeleton key={card.key} className={`${card.height} rounded-card bg-card`} />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {ROW_KEYS.map((row) => (
                <div key={row} className="flex h-14 items-center gap-4 rounded-[18px] bg-card px-5">
                  <Skeleton className="h-5 w-9" />
                  <Skeleton className="size-9 rounded-[33%]" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </>
        }
        aside={
          <>
            <Skeleton className="h-62 rounded-card bg-card" />
            <Skeleton className="h-80 rounded-card bg-card" />
          </>
        }
      />
    </LoadingRegion>
  );
};
