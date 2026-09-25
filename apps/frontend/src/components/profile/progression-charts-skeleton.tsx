import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

// Stable keys for the four curves (they have no identity of their own).
const CHART_KEYS = ["wpm", "raw", "accuracy", "consistency"];

// The four curves of the Progression while they load, at their height.
export const ProgressionChartsSkeleton = () => (
  <LoadingRegion label="Chargement de la Progression" className="grid gap-4 md:grid-cols-2">
    {CHART_KEYS.map((chart) => (
      <Skeleton key={chart} className="h-60 rounded-card" />
    ))}
  </LoadingRegion>
);
