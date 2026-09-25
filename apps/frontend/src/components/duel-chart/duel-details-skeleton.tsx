import { DuelChartSkeleton } from "@/components/duel-chart/duel-chart-skeleton";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

// A Duel's details while they load: its Duel chart, then both Results.
export const DuelDetailsSkeleton = () => (
  <LoadingRegion label="Chargement du Duel" className="px-3 py-4">
    <DuelChartSkeleton />
    <div className="grid gap-3 md:grid-cols-2">
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
    </div>
  </LoadingRegion>
);
