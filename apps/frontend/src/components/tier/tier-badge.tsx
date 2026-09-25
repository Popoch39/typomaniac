import { cn } from "cn";
import type { Standing } from "ranked";

import { standingName, TIER_COLORS } from "@/components/tier/tier";
import { TierDivisionBars } from "@/components/tier/tier-division-bars";
import { TierEmblem } from "@/components/tier/tier-emblem";

type TierBadgeProps = { standing: Standing; size?: "md" | "lg"; className?: string };

const EMBLEM_SIZES = { md: "size-8", lg: "size-14" };

// A Tier and its Division, recognisable without the colour: each Tier has its own emblem, the
// Division its bars (none in Maître). Screen readers hear the name; the drawing is hidden.
export const TierBadge = ({ standing, size = "md", className }: TierBadgeProps) => (
  <span
    className={cn("inline-flex flex-col items-center gap-1", TIER_COLORS[standing.tier], className)}
  >
    <span className={EMBLEM_SIZES[size]}>
      <TierEmblem tier={standing.tier} />
    </span>
    {standing.tier === "maitre" ? null : <TierDivisionBars division={standing.division} />}
    <span className="sr-only">{standingName(standing)}</span>
  </span>
);
