import { cn } from "cn";
import { useId } from "react";

import { AccuracyRing } from "@/components/profile/accuracy-ring";
import { PercentFigure } from "@/components/profile/percent-figure";
import {
  PROFILE_CARD_LABEL_PAINT,
  PROFILE_TILE_PAINT,
} from "@/components/profile/profile-card-paint";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The User's average accuracy, on its tile: the ring filled as much, then the share, large, at the
// foot of the tile.
export const AccuracyCard = ({ accuracy }: { accuracy: number | null }) => {
  const locale = useLocale();
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn("flex flex-col justify-between gap-3 p-6", PROFILE_TILE_PAINT)}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={titleId} className={PROFILE_CARD_LABEL_PAINT}>
          {m.profile_stat_average_accuracy({}, { locale })}
        </h2>
        <AccuracyRing accuracy={accuracy ?? 0} />
      </div>
      <PercentFigure value={accuracy} />
    </section>
  );
};
