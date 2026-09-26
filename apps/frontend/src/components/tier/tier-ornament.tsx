import type { Tier } from "ranked";

import { TierOrnamentArt } from "@/components/tier/tier-ornament-art";

// A Tier's Ornament alone: its glow and its flames overflow the box. Only seen.
export const TierOrnament = ({ tier }: { tier: Tier }) => (
  <svg viewBox="0 0 120 120" className="size-full overflow-visible" aria-hidden>
    <TierOrnamentArt tier={tier} />
  </svg>
);
