import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

// Stable keys for three placeholder rows (they have no identity of their own).
const ROW_KEYS = ["a", "b", "c"];

type UserRowsSkeletonProps = { label: string; rows?: number };

// Rows of Users while they load, on a card: avatar, Handle, an action.
export const UserRowsSkeleton = ({ label, rows = ROW_KEYS.length }: UserRowsSkeletonProps) => (
  <LoadingRegion label={label} className="gap-0 divide-y divide-border rounded-card bg-card">
    {ROW_KEYS.slice(0, rows).map((row) => (
      <div key={row} className="flex items-center gap-3 px-5 py-3">
        <Skeleton className="size-8 rounded-[33%]" />
        <Skeleton className="h-4 w-28 flex-1" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
    ))}
  </LoadingRegion>
);
