import { cn } from "cn";
import { PLACEMENT_DUELS, type Rank } from "ranked";

import { divisionMeterText, placementMeterText } from "@/components/tier/rank/tp-meter-text";
import { tpProgressOf } from "@/components/tier/rank/tp-progress-of";
import { TIER_COLORS } from "@/components/tier/tier";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// One notch per Placement Duel, numbered from 1.
const PLACEMENT_NOTCHES = Array.from({ length: PLACEMENT_DUELS }, (_, index) => index + 1);

// The drawing's thickness: thin under a rank in a line, thicker where the rank stands out (the hero
// of `/profile`, the header of a Profile) or stands alone.
const THICKNESS = { sm: "h-1", md: "h-1.5", lg: "h-2" };

type TpProgressProps = { rank: Rank | null; size?: keyof typeof THICKNESS };

// Under a rank: a bar filled to the Division's TP out of 100 in the Tier's colour, or a notch per
// Placement Duel, those played filled. Nothing for Maniac, whose TP have no ceiling, nor without a
// Rating. Screen readers read a meter, with what is left to the next rank; the drawing is hidden.
export const TpProgress = ({ rank, size = "sm" }: TpProgressProps) => {
  const locale = useLocale();
  const progress = tpProgressOf(rank, locale);
  const thickness = THICKNESS[size];

  if (progress === null || progress.kind === "maniac") {
    return null;
  }

  if (progress.kind === "placement") {
    return (
      <span className="block">
        <meter
          className="sr-only"
          aria-label={m.tp_progress_placement_label({}, { locale })}
          min={0}
          max={progress.of}
          value={progress.played}
          aria-valuetext={placementMeterText(progress.played, progress.of, locale)}
        />
        <span aria-hidden="true" className="flex gap-1">
          {PLACEMENT_NOTCHES.map((notch) => (
            <span
              key={notch}
              data-played={notch <= progress.played ? "" : undefined}
              className={cn(
                "flex-1 rounded-full bg-border data-played:bg-muted-foreground",
                thickness,
              )}
            />
          ))}
        </span>
      </span>
    );
  }

  // In spans, displayed as blocks: it may stand in a button, as on the User's card.
  return (
    <span className="block">
      <meter
        className="sr-only"
        aria-label={m.tp_progress_division_label({}, { locale })}
        min={0}
        max={progress.of}
        value={progress.tp}
        aria-valuetext={divisionMeterText(progress.tp, progress.of, progress.toNext, locale)}
      />
      <span
        aria-hidden="true"
        className={cn("block overflow-hidden rounded-full bg-border", thickness)}
      >
        <span
          className={cn("block h-full rounded-full bg-current", TIER_COLORS[progress.tier])}
          style={{ width: `${Math.min(progress.tp / progress.of, 1) * 100}%` }}
        />
      </span>
    </span>
  );
};
