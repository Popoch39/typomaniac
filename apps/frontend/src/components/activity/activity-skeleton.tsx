import { cn } from "cn";

import { ACTIVITY_CARD_PAINT } from "@/components/activity/activity-paint";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

// Stable keys for the placeholder rows (they have no identity of their own).
const ROW_KEYS = ["a", "b", "c", "d"];

// The Activity while it loads, on its card: an avatar, a line of text and its time.
export const ActivitySkeleton = () => (
  <LoadingRegion label="Chargement de l'Activity" className={cn("gap-0", ACTIVITY_CARD_PAINT)}>
    {ROW_KEYS.map((row) => (
      <div key={row} className="flex items-start gap-3 p-3">
        <Skeleton className="size-9 shrink-0 rounded-[33%]" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </LoadingRegion>
);
