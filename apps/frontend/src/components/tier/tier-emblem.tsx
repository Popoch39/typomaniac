import type { Tier } from "ranked";

import { emblemId, ref } from "@/components/tier/tier-sprite-paint";

// A Tier's Emblem from the sprite, framed on the part of the 120 grid it is drawn in: it fills
// the box its caller gives it, as the flat emblems before it did. Only seen.
export const TierEmblem = ({ tier }: { tier: Tier }) => (
  <svg viewBox="30 28 60 60" className="size-full" aria-hidden data-tier-emblem>
    <use href={ref(emblemId(tier))} width="120" height="120" />
  </svg>
);
