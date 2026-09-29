import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Stable keys for five placeholder rows (they have no identity of their own).
const ROW_KEYS = ["a", "b", "c", "d", "e"];

// `label` names what loads: the Duel history itself when left out.
type DuelHistorySkeletonProps = { label?: string; rows?: number };

// Rows of the Duel history while they load, in its card: opponent and date, Scores, outcome.
export const DuelHistorySkeleton = ({
  label,
  rows = ROW_KEYS.length,
}: DuelHistorySkeletonProps) => {
  const locale = useLocale();

  return (
    <LoadingRegion
      label={label ?? m.duel_history_loading({}, { locale })}
      className="gap-0.5 rounded-card bg-card p-2"
    >
      {ROW_KEYS.slice(0, rows).map((row) => (
        <div key={row} className="flex h-16.5 items-center gap-3.5 px-4">
          <Skeleton className="size-9.5 rounded-[33%]" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-21" />
        </div>
      ))}
    </LoadingRegion>
  );
};
