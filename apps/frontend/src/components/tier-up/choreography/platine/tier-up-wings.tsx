import type { Tier } from "ranked";

import { TierUpWing } from "@/components/tier-up/choreography/platine/tier-up-wing";
import { TierUpMirrored } from "@/components/tier-up/parts/tier-up-mirrored";
import {
  type OrnamentBox,
  TierUpOrnamentLayer,
} from "@/components/tier-up/parts/tier-up-ornament-layer";

// The Platine sits at 32.5, 30.5 of the 120 grid, 1.72 times its own 32.
const PLATINE_BOX: OrnamentBox = { left: 189, top: 177, size: 698 };

// The wings of the Platine's Ornament around its Emblem, as its artboard draws them, the right one
// mirroring the left.
export const TierUpWings = ({ tier }: { tier: Tier }) => (
  <TierUpOrnamentLayer box={PLATINE_BOX}>
    <TierUpMirrored>
      <TierUpWing tier={tier} />
    </TierUpMirrored>
  </TierUpOrnamentLayer>
);
