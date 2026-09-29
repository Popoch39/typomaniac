import { DuelChartSkeleton } from "@/components/duel-chart/duel-chart-skeleton";
import { DUEL_RESULT_NAMES } from "@/components/duel-history/duel-result-lines";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

// The chosen Duel's details while they load: its Duel chart, the Results table, then the way to its
// Replay.
export const DuelDetailsSkeleton = () => (
  <LoadingRegion label="Chargement du Duel" className="gap-5">
    <DuelChartSkeleton />
    <div className="flex flex-col gap-3.5">
      {DUEL_RESULT_NAMES.map((line) => (
        <Skeleton key={line} className="h-5 w-full" />
      ))}
    </div>
    <Skeleton className="h-12 w-44 rounded-[14px]" />
  </LoadingRegion>
);
