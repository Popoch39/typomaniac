import { cn } from "cn";

import { FRIENDS_CARD_PAINT } from "@/components/friends/friends-paint";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

// Stable keys for three placeholder rows (they have no identity of their own).
const ROW_KEYS = ["a", "b", "c"];

type UserRowsSkeletonProps = { label: string; rows?: number };

// Rows of Users while they load, on their card: avatar, Handle, an action.
export const UserRowsSkeleton = ({ label, rows = ROW_KEYS.length }: UserRowsSkeletonProps) => (
  <LoadingRegion label={label} className={cn("gap-0", FRIENDS_CARD_PAINT)}>
    {ROW_KEYS.slice(0, rows).map((row) => (
      <div key={row} className="flex h-14 items-center gap-3 pr-1.5 pl-3">
        <Skeleton className="size-9 rounded-[33%]" />
        <Skeleton className="h-4 w-28 flex-1" />
        <Skeleton className="h-11 w-24 rounded-[14px]" />
      </div>
    ))}
  </LoadingRegion>
);
