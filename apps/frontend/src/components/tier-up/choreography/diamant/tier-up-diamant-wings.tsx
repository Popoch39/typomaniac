import type { Tier } from "ranked";

import { TierUpDiamantWing } from "@/components/tier-up/choreography/diamant/tier-up-diamant-wing";
import { TierUpMirrored } from "@/components/tier-up/parts/tier-up-mirrored";
import {
  type OrnamentBox,
  TierUpOrnamentLayer,
} from "@/components/tier-up/parts/tier-up-ornament-layer";

// The Diamant sits at 31.5, 29.5 of the 120 grid, 1.78 times its own 32.
const DIAMANT_BOX: OrnamentBox = { left: 177, top: 166, size: 674 };

// The wings of the Diamant's Ornament around its Emblem, as its artboard draws them, the right one
// mirroring the left.
export const TierUpDiamantWings = ({ tier }: { tier: Tier }) => (
  <TierUpOrnamentLayer box={DIAMANT_BOX}>
    <TierUpMirrored>
      <TierUpDiamantWing tier={tier} />
    </TierUpMirrored>
  </TierUpOrnamentLayer>
);
