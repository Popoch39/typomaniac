import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

// Stable keys for the four curves (they have no identity of their own).
const CHART_KEYS = ["wpm", "raw", "accuracy", "consistency"];

// The four curves of the Progression while they load, at their height on its card.
export const ProgressionChartsSkeleton = () => (
  <LoadingRegion label="Chargement de la Progression" className="grid grid-cols-2 gap-x-6 gap-y-5">
    {CHART_KEYS.map((chart) => (
      <Skeleton key={chart} className="h-55 rounded-[20px]" />
    ))}
  </LoadingRegion>
);
