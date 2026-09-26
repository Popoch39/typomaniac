import { cn } from "cn";
import type { Tier } from "ranked";

import { TIER_COLORS } from "@/components/tier/tier";
import { TierEmblem } from "@/components/tier/tier-emblem";

// The great emblem of the Tier reached, in a halo of its colour. Only seen: the title under it
// names the rank. The wrappers move, never the SVG.
export const TierUpEmblem = ({ tier }: { tier: Tier }) => (
  <div aria-hidden className={cn("relative grid size-44 place-items-center", TIER_COLORS[tier])}>
    <div
      data-tier-up="halo"
      className="absolute inset-0 rounded-full bg-current opacity-30 blur-2xl"
    />
    <div data-tier-up="emblem" className="relative size-28">
      <TierEmblem tier={tier} />
    </div>
  </div>
);
