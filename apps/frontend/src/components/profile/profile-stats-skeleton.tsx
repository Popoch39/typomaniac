import { cn } from "cn";

import { PROGRESSION_CARD_PAINT, STAT_TILE_PAINT } from "@/components/profile/profile-paint";
import { ProgressionChartsSkeleton } from "@/components/profile/progression-charts-skeleton";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Stable keys for the placeholder tiles (they have no identity of their own).
const TILE_KEYS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

// The Stats while they load: the title and the grid of tiles, then the Progression's card.
export const ProfileStatsSkeleton = () => {
  const locale = useLocale();

  return (
    <LoadingRegion label={m.profile_stats_loading({}, { locale })} className="gap-6">
      <div className="flex flex-col gap-2.5">
        <Skeleton className="mx-1 h-4 w-12" />
        <div className="grid grid-cols-5 gap-2.5">
          {TILE_KEYS.map((tile) => (
            <Skeleton key={tile} className={cn("h-20", STAT_TILE_PAINT)} />
          ))}
        </div>
      </div>
      <div className={PROGRESSION_CARD_PAINT}>
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-13 w-80 rounded-full" />
        </div>
        <ProgressionChartsSkeleton />
      </div>
    </LoadingRegion>
  );
};
