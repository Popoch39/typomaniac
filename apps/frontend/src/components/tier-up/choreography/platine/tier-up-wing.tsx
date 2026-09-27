import type { Tier } from "ranked";

import { FEATHER_ID, LINE, metalId, paint, ref } from "@/components/tier/sprite/tier-sprite-paint";
import { PLATINE_FAN, WING_ROOT } from "@/components/tier/sprite/tier-wing-fans";

// The wing flutters about its root by `--flap` (deg), each feather turns about it by `--turn`
// (deg) and grows by `--grow`: GSAP moves the variables, never an SVG transform.
const FLAPPING = "[transform:rotate(calc(var(--flap,0)*1deg))]";

const ROOT = { transformOrigin: `${WING_ROOT.x}px ${WING_ROOT.y}px` };

const UNFURLED =
  "[transform-origin:0_0] [transform:rotate(calc(var(--turn,0)*1deg))_scale(var(--grow,1))]";

// A wing of the Platine's Ornament, on its 120 grid, as the Or → Platine artboard unfurls it:
// its feathers, unseen until each unfurls from its root, then the whole wing fluttering.
export const TierUpWing = ({ tier }: { tier: Tier }) => (
  <g data-tier-up="wing" className={FLAPPING} style={ROOT}>
    <g transform={`translate(${WING_ROOT.x} ${WING_ROOT.y})`}>
      {PLATINE_FAN.map(([turn]) => (
        <g key={turn} data-tier-up="feather" className={UNFURLED} opacity={0}>
          <use href={ref(FEATHER_ID)} fill={paint(metalId(tier))} {...LINE} />
        </g>
      ))}
    </g>
  </g>
);
