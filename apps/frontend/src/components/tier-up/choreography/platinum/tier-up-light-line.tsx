import type { Tier } from "ranked";

import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

// The line of light that splits the stage where the gold turned over, before the Platinum is
// assembled: a thin stroke of its light, nearly white, down the Blason's middle, unseen until it
// flashes.
export const TierUpLightLine = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <div
      data-tier-up="line"
      className="absolute top-[230px] left-[718px] h-[240px] w-[4px] opacity-0"
      style={{ background: paint.flash, boxShadow: paint.glow(22, 6) }}
    />
  );
};
