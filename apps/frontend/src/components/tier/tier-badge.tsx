import { cn } from "cn";

import { TIER_COLORS, TIER_NAMES, type Division, type Tier } from "@/components/tier/tier";
import { TierDivisionBars } from "@/components/tier/tier-division-bars";
import { TierEmblem } from "@/components/tier/tier-emblem";

type TierBadgeProps = { tier: Tier; division: Division; className?: string };

// A tier and its division, recognisable without the colour: each tier has its own emblem.
// Screen readers hear the name and the division; the drawing is hidden from them.
export const TierBadge = ({ tier, division, className }: TierBadgeProps) => (
  <span className={cn("inline-flex flex-col items-center gap-1", TIER_COLORS[tier], className)}>
    <span className="size-8">
      <TierEmblem tier={tier} />
    </span>
    <TierDivisionBars division={division} />
    <span className="sr-only">{`${TIER_NAMES[tier]}, division ${division}`}</span>
  </span>
);
