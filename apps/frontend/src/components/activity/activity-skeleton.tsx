import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

// Stable keys for the placeholder rows (they have no identity of their own).
const ROW_KEYS = ["a", "b", "c", "d"];

// The Activity while it loads, on a card: an avatar, a line of text and its time.
export const ActivitySkeleton = () => (
  <LoadingRegion
    label="Chargement de l'Activity"
    className="gap-0 divide-y divide-border rounded-card bg-card"
  >
    {ROW_KEYS.map((row) => (
      <div key={row} className="flex items-center gap-3 px-5 py-3">
        <Skeleton className="size-8 shrink-0 rounded-[33%]" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </LoadingRegion>
);
