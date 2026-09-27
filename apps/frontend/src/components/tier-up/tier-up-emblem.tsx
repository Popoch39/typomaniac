import type { Tier } from "ranked";

import { AuraFrame } from "@/components/aura/aura-frame";
import { EMBLEM_LAYERS } from "@/components/tier/tier-emblem-layers";
import { EMBLEM_OUTLINES } from "@/components/tier/tier-emblem-outline";
import { TierUpEmblemBody } from "@/components/tier-up/tier-up-emblem-body";
import { tierUpPaint } from "@/components/tier-up/tier-up-paint";

// A layer of the Emblem, over the others, on its 32 × 32 grid.
const LAYER = "absolute inset-0 size-full overflow-visible";

// The Emblem of the Tier reached, large, where the old one stood, as the canvas draws it in
// layers: its outline traces itself in light, its metal body fills it in (in its full Aura where
// its Tier has one, lit from behind), its engraving is cut, a flash of its shape, then it lands.
// Only seen: the name under it says the Tier. The wrappers move, never the drawing.
export const TierUpEmblem = ({ tier }: { tier: Tier }) => {
  const { d } = EMBLEM_OUTLINES[tier];
  const paint = tierUpPaint(tier);

  return (
    <div
      data-tier-up="emblem"
      data-tier={tier}
      aria-hidden
      className="absolute top-[190px] left-[560px] size-[320px]"
    >
      <svg viewBox="0 0 32 32" className={LAYER}>
        <path
          data-tier-up="outline"
          d={d}
          fill="none"
          stroke={paint.light}
          strokeWidth={0.35}
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
        />
      </svg>
      <div data-tier-up="fill" className="absolute inset-0">
        <AuraFrame tier={tier} aura="full" Drawing={TierUpEmblemBody} />
      </div>
      <svg viewBox="0 0 32 32" className={LAYER}>
        <g data-tier-up="engraving">{EMBLEM_LAYERS[tier].engraving}</g>
        <path data-tier-up="flash" d={d} fill={paint.flash} opacity={0} />
      </svg>
    </div>
  );
};
