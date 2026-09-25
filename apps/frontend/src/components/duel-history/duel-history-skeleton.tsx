import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

// Stable keys for five placeholder rows (they have no identity of their own).
const ROW_KEYS = ["a", "b", "c", "d", "e"];

type DuelHistorySkeletonProps = { label?: string; rows?: number };

// Rows of the Duel history while they load: opponent, outcome, Scores, wpm.
export const DuelHistorySkeleton = ({
  label = "Chargement de la Duel history",
  rows = ROW_KEYS.length,
}: DuelHistorySkeletonProps) => (
  <LoadingRegion label={label}>
    {ROW_KEYS.slice(0, rows).map((row) => (
      <div key={row} className="flex items-center gap-4 px-5 py-3">
        <Skeleton className="size-8 rounded-[33%]" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </LoadingRegion>
);
