import { cn } from "cn";
import type { Standing } from "ranked";

import { TIER_COLORS } from "@/components/tier/tier";

// The Division's TP bar, out of 100 (never Maniac, uncapped): the TP now in the Tier's colour,
// then up to `reached`, what a win would bring, in hatches of the card's colour. The timeline fills
// the hatches in (`stake-gain`); they slide along, but not under reduced motion.
type FaceOffStakeBarProps = { standing: Standing; reached: number };

export const FaceOffStakeBar = ({ standing, reached }: FaceOffStakeBarProps) => (
  <div aria-hidden className="relative h-3 overflow-hidden rounded-full bg-foreground/10">
    <span
      className={cn("absolute inset-y-0 left-0 bg-current", TIER_COLORS[standing.tier])}
      style={{ width: `${standing.tp}%` }}
    />
    <span
      data-face-off="stake-gain"
      className="absolute inset-y-0 origin-left bg-stake-hatch motion-safe:animate-stake-hatch"
      style={{ left: `${standing.tp}%`, width: `${reached - standing.tp}%` }}
    />
  </div>
);
