import type { Tier } from "ranked";

import { TierUpManiacFan } from "@/components/tier-up/choreography/maniac/tier-up-maniac-fan";
import { FLAPPING, WING_ROOTED } from "@/components/tier-up/parts/tier-up-feathers";
import { POPPED } from "@/components/tier-up/parts/tier-up-popped";
import { deepId, HOT_ID, paint, ref, SPARK_ID } from "@/components/tier/sprite/tier-sprite-paint";
import { MANIAC_WING_EMBERS, WING_ROOT } from "@/components/tier/sprite/tier-wing-fans";

// Which wing: the left one, or the right one mirroring it. Their fire glows out of step.
type WingSide = "left" | "right";

type TierUpManiacWingProps = { tier: Tier; side: WingSide };

// A wing of the Maniac's Ornament, on its 120 grid, as the Diamond → Maniac artboard spreads it:
// its feathers, the deep ones behind those of fire, each unseen until it spreads from its root,
// then the whole wing beating once and fluttering; by it, its embers, each unseen until it pops in.
export const TierUpManiacWing = ({ tier, side }: TierUpManiacWingProps) => (
  <>
    <g data-tier-up="wing" className={FLAPPING} style={WING_ROOTED}>
      <g transform={`translate(${WING_ROOT.x} ${WING_ROOT.y})`}>
        <TierUpManiacFan fan="deep" fill={paint(deepId(tier))} />
        <g data-tier-up="hot-feathers" data-side={side}>
          <TierUpManiacFan fan="hot" fill={paint(HOT_ID)} />
        </g>
      </g>
    </g>
    <g data-tier-up="wing-ember" data-index={0} className={POPPED} opacity={0}>
      <use href={ref(SPARK_ID)} fill={paint(HOT_ID)} transform={MANIAC_WING_EMBERS.spark} />
    </g>
    {MANIAC_WING_EMBERS.dots.map(([cx, cy, r], index) => (
      <g
        key={`${cx} ${cy}`}
        data-tier-up="wing-ember"
        data-index={index + 1}
        className={POPPED}
        opacity={0}
      >
        <circle cx={cx} cy={cy} r={r} fill={paint(HOT_ID)} />
      </g>
    ))}
  </>
);
