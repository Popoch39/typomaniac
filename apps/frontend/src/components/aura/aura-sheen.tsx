import type { Tier } from "ranked";

import { SHEEN_BAND, SHEEN_ID, SHEEN_LEAN, sheenMaskId } from "@/components/aura/aura-paint";
import { paint } from "@/components/tier/tier-sprite-paint";

// The sheen over one Ornament: a leaning band of light, cut to the Ornament's shape. The cut
// stays still while the band moves inside it (`data-aura-sheen`), so it never leaves the metal.
export const AuraSheen = ({ tier }: { tier: Tier }) => (
  <g mask={paint(sheenMaskId(tier))}>
    <g transform={SHEEN_LEAN}>
      <rect data-aura-sheen {...SHEEN_BAND} fill={paint(SHEEN_ID)} />
    </g>
  </g>
);
