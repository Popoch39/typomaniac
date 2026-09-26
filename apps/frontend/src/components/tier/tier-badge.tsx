import { cn } from "cn";
import type { Standing } from "ranked";

import { standingName, TIER_COLORS } from "@/components/tier/tier";
import { TierBlason } from "@/components/tier/tier-blason";
import { TierDivisionBars } from "@/components/tier/tier-division-bars";
import { TierEmblem } from "@/components/tier/tier-emblem";

type TierBadgeProps = { standing: Standing; size?: "md" | "lg"; className?: string };

// A Tier and its Division, recognisable without the colour: each Tier has its own Emblem, laid on
// its Ornament (the Blason) in the large size, the Division its bars (none in Maniac). Screen
// readers hear the name; the drawing is hidden.
export const TierBadge = ({ standing, size = "md", className }: TierBadgeProps) => (
  <span
    className={cn("inline-flex flex-col items-center gap-1", TIER_COLORS[standing.tier], className)}
  >
    {size === "lg" ? (
      <span className="size-24">
        <TierBlason tier={standing.tier} />
      </span>
    ) : (
      <span className="size-8">
        <TierEmblem tier={standing.tier} />
      </span>
    )}
    {standing.tier === "maniac" ? null : <TierDivisionBars division={standing.division} />}
    <span className="sr-only">{standingName(standing)}</span>
  </span>
);
