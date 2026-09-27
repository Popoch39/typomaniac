import type { Tier } from "ranked";

import { TierUpDiamantFan } from "@/components/tier-up/choreography/diamant/tier-up-diamant-fan";
import { FLAPPING, WING_ROOTED } from "@/components/tier-up/parts/tier-up-feathers";
import { POPPED } from "@/components/tier-up/parts/tier-up-popped";
import { BRIGHT, deepId, LINE, metalId, paint } from "@/components/tier/sprite/tier-sprite-paint";
import { WING_CRYSTAL, WING_ROOT } from "@/components/tier/sprite/tier-wing-fans";

// A wing of the Diamant's Ornament, on its 120 grid, as the Platine → Diamant artboard unfurls it:
// its crystal, unseen until it pops in, its feathers, the deep ones behind, each unseen until it
// unfurls from its root, then the whole wing fluttering.
export const TierUpDiamantWing = ({ tier }: { tier: Tier }) => (
  <g data-tier-up="wing" className={FLAPPING} style={WING_ROOTED}>
    <g data-tier-up="crystal" className={POPPED} opacity={0}>
      <path
        d={WING_CRYSTAL.d}
        fill={paint(metalId(tier))}
        {...LINE}
        transform={WING_CRYSTAL.transform}
      />
      <path d={WING_CRYSTAL.lit} {...BRIGHT} transform={WING_CRYSTAL.transform} />
    </g>
    <g transform={`translate(${WING_ROOT.x} ${WING_ROOT.y})`}>
      <TierUpDiamantFan fan="deep" fill={paint(deepId(tier))} />
      <TierUpDiamantFan fan="metal" fill={paint(metalId(tier))} />
    </g>
  </g>
);
