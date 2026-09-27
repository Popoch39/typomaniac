import type { Tier } from "ranked";

import { TierUpManiacWing } from "@/components/tier-up/choreography/maniac/tier-up-maniac-wing";
import {
  type OrnamentBox,
  TierUpOrnamentLayer,
} from "@/components/tier-up/parts/tier-up-ornament-layer";

// The Maniac sits at 30.4, 28.4 of the 120 grid, 1.85 times its own 32.
const MANIAC_BOX: OrnamentBox = { left: 164, top: 153, size: 649 };

// The wings of the Maniac's Ornament around its crown, as its artboard draws them, the right one
// mirroring the left: each its own, since their fire glows out of step.
export const TierUpManiacWings = ({ tier }: { tier: Tier }) => (
  <TierUpOrnamentLayer box={MANIAC_BOX}>
    <TierUpManiacWing tier={tier} side="left" />
    <g transform="translate(120 0) scale(-1 1)">
      <TierUpManiacWing tier={tier} side="right" />
    </g>
  </TierUpOrnamentLayer>
);
