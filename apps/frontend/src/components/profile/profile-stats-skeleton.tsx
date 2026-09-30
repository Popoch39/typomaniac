import { PROFILE_BENTO_PAINT } from "@/components/profile/profile-card-paint";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Stable keys for the placeholder Records (they have no identity of their own).
const RECORD_KEYS = ["wpm", "score", "combo"];

// The Stats while they load, the bento's tiles at their places: the wpm tile over both rows, the win
// rate and the accuracy, then the three Records.
export const ProfileStatsSkeleton = () => {
  const locale = useLocale();

  return (
    <LoadingRegion label={m.profile_stats_loading({}, { locale })} className={PROFILE_BENTO_PAINT}>
      <Skeleton className="row-span-2 rounded-card" />
      <Skeleton className="rounded-card" />
      <Skeleton className="rounded-card" />
      <div className="col-span-2 grid grid-cols-3 gap-4">
        {RECORD_KEYS.map((record) => (
          <Skeleton key={record} className="rounded-[24px]" />
        ))}
      </div>
    </LoadingRegion>
  );
};
