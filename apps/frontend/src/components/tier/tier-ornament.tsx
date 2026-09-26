import type { Tier } from "ranked";

import { ornamentId, ref } from "@/components/tier/tier-sprite-paint";

// A Tier's Ornament alone, from the sprite: its glow and its flames overflow the box. Only seen.
export const TierOrnament = ({ tier }: { tier: Tier }) => (
  <svg viewBox="0 0 120 120" className="size-full overflow-visible" aria-hidden>
    <use href={ref(ornamentId(tier))} width="120" height="120" />
  </svg>
);
