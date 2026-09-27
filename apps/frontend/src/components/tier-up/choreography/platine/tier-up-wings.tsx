import type { Tier } from "ranked";

import { TierUpWing } from "@/components/tier-up/choreography/platine/tier-up-wing";

// The wings of the Platine's Ornament around its Emblem, as its artboard draws them: on the 120
// grid of the Ornament, laid over the Emblem's 320 px box (the Emblem sits at 32.5, 30.5 of that
// grid, 1.72 times its own 32), the right one mirroring the left.
export const TierUpWings = ({ tier }: { tier: Tier }) => (
  <svg
    viewBox="0 0 120 120"
    className="absolute -top-[177px] -left-[189px] size-[698px] overflow-visible"
  >
    <TierUpWing tier={tier} />
    <g transform="translate(120 0) scale(-1 1)">
      <TierUpWing tier={tier} />
    </g>
  </svg>
);
