import { PLACEMENT_DUELS } from "ranked";

import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { cn } from "cn";

// A Placement Duel: how many are left before the rank shows, one dot per Placement Duel.
export const PlacementProgress = ({ placementsLeft }: { placementsLeft: number }) => {
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg font-semibold">
        {m.duel_rank_placement(
          { count: placementsLeft, shown: numberFormat(locale).format(placementsLeft) },
          { locale },
        )}
      </p>
      <div className="flex gap-2" aria-hidden>
        {Array.from({ length: PLACEMENT_DUELS }, (_, index) => (
          <span
            key={index}
            className={cn(
              "size-3 rounded-full",
              index < PLACEMENT_DUELS - placementsLeft ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
};
