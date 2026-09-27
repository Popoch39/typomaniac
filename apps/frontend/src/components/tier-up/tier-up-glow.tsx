import type { Tier } from "ranked";

import { tierUpPaint } from "@/components/tier-up/tier-up-paint";

// The halo right around the Emblem, `size` px wide: unseen until it opens at the impact, then it
// breathes. Placed in a `TierUpCenter`.
export const TierUpGlow = ({ tier, size }: { tier: Tier; size: number }) => (
  <div
    data-tier-up="halo"
    className="absolute opacity-0"
    style={{ left: -size / 2, top: -size / 2, width: size, height: size }}
  >
    <div
      data-tier-up="breath"
      className="size-full rounded-full"
      style={{ background: tierUpPaint(tier).halo }}
    />
  </div>
);
