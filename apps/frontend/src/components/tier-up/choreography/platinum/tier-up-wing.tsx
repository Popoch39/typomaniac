import type { Tier } from "ranked";

import { FLAPPING, UNFURLED, WING_ROOTED } from "@/components/tier-up/parts/tier-up-feathers";
import { FEATHER_ID, LINE, metalId, paint, ref } from "@/components/tier/sprite/tier-sprite-paint";
import { PLATINUM_FAN, WING_ROOT } from "@/components/tier/sprite/tier-wing-fans";

// A wing of the Platinum's Ornament, on its 120 grid, as the Gold → Platinum artboard unfurls it:
// its feathers, unseen until each unfurls from its root, then the whole wing fluttering.
export const TierUpWing = ({ tier }: { tier: Tier }) => (
  <g data-tier-up="wing" className={FLAPPING} style={WING_ROOTED}>
    <g transform={`translate(${WING_ROOT.x} ${WING_ROOT.y})`}>
      {PLATINUM_FAN.map(([turn]) => (
        <g key={turn} data-tier-up="feather" className={UNFURLED} opacity={0}>
          <use href={ref(FEATHER_ID)} fill={paint(metalId(tier))} {...LINE} />
        </g>
      ))}
    </g>
  </g>
);
