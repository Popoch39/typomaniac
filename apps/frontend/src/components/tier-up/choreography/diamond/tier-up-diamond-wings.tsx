import type { Tier } from "ranked";

import { TierUpDiamondWing } from "@/components/tier-up/choreography/diamond/tier-up-diamond-wing";
import { TierUpMirrored } from "@/components/tier-up/parts/tier-up-mirrored";
import {
  type OrnamentBox,
  TierUpOrnamentLayer,
} from "@/components/tier-up/parts/tier-up-ornament-layer";

// The Diamond sits at 31.5, 29.5 of the 120 grid, 1.78 times its own 32.
const DIAMOND_BOX: OrnamentBox = { left: 177, top: 166, size: 674 };

// The wings of the Diamond's Ornament around its Emblem, as its artboard draws them, the right one
// mirroring the left.
export const TierUpDiamondWings = ({ tier }: { tier: Tier }) => (
  <TierUpOrnamentLayer box={DIAMOND_BOX}>
    <TierUpMirrored>
      <TierUpDiamondWing tier={tier} />
    </TierUpMirrored>
  </TierUpOrnamentLayer>
);
