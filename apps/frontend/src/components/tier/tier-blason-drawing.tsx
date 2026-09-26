import type { Tier } from "ranked";

import { TierOrnamentArt } from "@/components/tier/tier-ornament-art";
import { emblemId, ref } from "@/components/tier/tier-sprite-paint";

// A Tier's Blason in its svg: its Emblem laid on its Ornament. The glow overflows the box.
export const TierBlasonDrawing = ({ tier, glow }: { tier: Tier; glow: boolean }) => (
  <svg viewBox="0 0 120 120" className="size-full overflow-visible" aria-hidden data-tier-blason>
    <TierOrnamentArt tier={tier} glow={glow} />
    <use href={ref(emblemId(tier))} width="120" height="120" />
  </svg>
);
