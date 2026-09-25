import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

// Stable keys for the placeholder rows (they have no identity of their own).
const ROW_KEYS = ["a", "b", "c", "d", "e", "f"];

// Rows of the Classement while they load: place, avatar, Handle, rank.
export const LeaderboardSkeleton = () => (
  <LoadingRegion label="Chargement du Classement">
    {ROW_KEYS.map((row) => (
      <div key={row} className="flex items-center gap-4 rounded-2xl bg-card px-5 py-3">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="size-9 rounded-[33%]" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </LoadingRegion>
);
