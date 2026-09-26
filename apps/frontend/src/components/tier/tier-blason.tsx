import type { Tier } from "ranked";

import { emblemId, ornamentId, ref } from "@/components/tier/tier-sprite-paint";

// A Tier's Blason: its Emblem laid on its Ornament, shown large where the rank stands out. Both
// grow from one Tier to the next; the glow overflows the box. Only seen.
export const TierBlason = ({ tier }: { tier: Tier }) => (
  <svg viewBox="0 0 120 120" className="size-full overflow-visible" aria-hidden data-tier-blason>
    <use href={ref(ornamentId(tier))} width="120" height="120" />
    <use href={ref(emblemId(tier))} width="120" height="120" />
  </svg>
);
