import { ProgressionChartsSkeleton } from "@/components/profile/progression-charts-skeleton";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

// Stable keys for the placeholder tiles (they have no identity of their own).
const TILE_KEYS = ["a", "b", "c", "d", "e", "f"];

// The Stats while they load: the tiles, the record, then the curves.
export const ProfileStatsSkeleton = () => (
  <LoadingRegion label="Chargement des Stats">
    <Skeleton className="h-7 w-20" />
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {TILE_KEYS.map((tile) => (
        <Skeleton key={tile} className="h-20 rounded-card" />
      ))}
    </div>
    <Skeleton className="h-20 rounded-card" />
    <ProgressionChartsSkeleton />
  </LoadingRegion>
);
