import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Stable keys for the placeholder Records (they have no identity of their own).
const RECORD_KEYS = ["wpm", "score", "combo"];

// The Stats while they load, at the Vitrine's places: the wpm card, the win rate and the accuracy
// beside it, then the title and the three tiles of the Records.
export const ProfileStatsSkeleton = () => {
  const locale = useLocale();

  return (
    <LoadingRegion label={m.profile_stats_loading({}, { locale })} className="gap-8">
      <div className="grid grid-cols-[minmax(0,1fr)_22.5rem] gap-5">
        <Skeleton className="h-133 rounded-card" />
        <div className="flex flex-col gap-5">
          <Skeleton className="h-80 rounded-card" />
          <Skeleton className="flex-1 rounded-card" />
        </div>
      </div>
      <div className="flex flex-col gap-3.5">
        <Skeleton className="h-4 w-20" />
        <div className="grid grid-cols-3 gap-5">
          {RECORD_KEYS.map((record) => (
            <Skeleton key={record} className="h-25 rounded-[24px]" />
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
};
