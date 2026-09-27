import type { Tier } from "ranked";

import { TierOrnamentArt } from "@/components/tier/drawing/tier-ornament-art";

// A Tier's Ornament alone in its svg: its glow and its flames overflow the box.
export const TierOrnamentDrawing = ({ tier, glow }: { tier: Tier; glow: boolean }) => (
  <svg viewBox="0 0 120 120" className="size-full overflow-visible" aria-hidden>
    <TierOrnamentArt tier={tier} glow={glow} />
  </svg>
);
