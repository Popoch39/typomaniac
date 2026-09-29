import { cn } from "cn";
import { PLACEMENT_DUELS, type Rank } from "ranked";

import { tpProgressOf } from "@/components/tier/rank/tp-progress-of";
import { TIER_COLORS } from "@/components/tier/tier";

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
  const progress = tpProgressOf(rank);
  const thickness = THICKNESS[size];

  if (progress === null || progress.kind === "maniac") {
    return null;
  }

  if (progress.kind === "placement") {
    return (
      <div>
        <meter
          className="sr-only"
          aria-label="Placement"
          min={0}
          max={progress.of}
          value={progress.played}
          aria-valuetext={`${progress.played} Duels de Placement joués sur ${progress.of}`}
        />
        <div aria-hidden="true" className="flex gap-1">
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
        </div>
      </div>
    );
  }

  return (
    <div>
      <meter
        className="sr-only"
        aria-label="TP de la Division"
        min={0}
        max={progress.of}
        value={progress.tp}
        aria-valuetext={`${progress.tp} TP sur ${progress.of} · ${progress.toNext}`}
      />
      <div aria-hidden="true" className={cn("overflow-hidden rounded-full bg-border", thickness)}>
        <div
          className={cn("h-full rounded-full bg-current", TIER_COLORS[progress.tier])}
          style={{ width: `${Math.min(progress.tp / progress.of, 1) * 100}%` }}
        />
      </div>
    </div>
  );
};
