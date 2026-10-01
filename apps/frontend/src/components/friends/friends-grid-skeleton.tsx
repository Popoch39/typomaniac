import { cn } from "cn";

import { FRIENDS_GRID_PAINT } from "@/components/friends/friends-paint";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

// Stable keys for the placeholder rows (they have no identity of their own).
const ROW_KEYS = ["a", "b", "c", "d", "e", "f"];

// A tab's rows while they load, on its card, two by two: avatar, Handle and status, an action.
export const FriendsGridSkeleton = ({ label }: { label: string }) => (
  <LoadingRegion label={label} className={cn("gap-0", FRIENDS_GRID_PAINT)}>
    {ROW_KEYS.map((row) => (
      <div key={row} className="flex h-16 items-center gap-3 pr-2.5 pl-3">
        <Skeleton className="size-10 shrink-0 rounded-[33%]" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-9 w-24 rounded-[12px]" />
      </div>
    ))}
  </LoadingRegion>
);
