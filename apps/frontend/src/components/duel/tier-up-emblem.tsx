import { cn } from "cn";
import type { Tier } from "ranked";

import { TIER_COLORS } from "@/components/tier/tier";
import { TierBlason } from "@/components/tier/tier-blason";

// The great Blason of the Tier reached, in a halo of its colour. Only seen: the title under it
// names the rank. The wrappers move, never the SVG.
export const TierUpEmblem = ({ tier }: { tier: Tier }) => (
  <div aria-hidden className={cn("relative grid size-52 place-items-center", TIER_COLORS[tier])}>
    <div
      data-tier-up="halo"
      className="absolute inset-0 rounded-full bg-current opacity-30 blur-2xl"
    />
    <div data-tier-up="emblem" className="relative size-44">
      <TierBlason tier={tier} />
    </div>
  </div>
);
