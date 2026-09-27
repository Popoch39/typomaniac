import type { Tier } from "ranked";

import { AuraFrame } from "@/components/aura/aura-frame";
import { DIAMANT_FACETS } from "@/components/tier-up/choreography/diamant/diamant-facets";
import { TierUpDiamantWings } from "@/components/tier-up/choreography/diamant/tier-up-diamant-wings";
import { TierUpEmblemBody } from "@/components/tier-up/parts/tier-up-emblem-body";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { GLINTED } from "@/components/tier-up/parts/tier-up-popped";
import { EMBLEM_LAYERS } from "@/components/tier/sprite/tier-emblem-layers";
import { EMBLEM_OUTLINES, GEM_FACETS } from "@/components/tier/sprite/tier-emblem-outline";

// A layer of the Emblem, over the others, on its 32 × 32 grid.
const LAYER = "absolute inset-0 size-full overflow-visible";

// The Emblem of the Tier reached, as the Platine → Diamant artboard cuts it, 320 px, a little
// lower than the others: its facets fly in one by one, turning in depth, its cut is traced in
// light, then it slams down whole in a blinding white with a flash of its shape; its full Aura
// lights up from behind (under the wings and the metal, never over them), its wings unfurl feather
// by feather, the crystal over each pops in, and the glint on its lit facet pops in, then
// twinkles. Only seen: the name under it says the Tier. The wrappers move, never the drawing.
export const TierUpCutEmblem = ({ tier }: { tier: Tier }) => {
  const { d } = EMBLEM_OUTLINES[tier];
  const { body, engraving } = EMBLEM_LAYERS[tier];
  const paint = tierUpPaint(tier);

  return (
    <div
      data-tier-up="emblem"
      data-tier={tier}
      aria-hidden
      className="absolute top-[208px] left-[560px] size-[320px]"
    >
      {/* Its body drawn once more over the Aura's canvas, hidden under the one cut: only the
          Aura's light shows, from the impact on. */}
      <div data-tier-up="aura" className="absolute inset-0 opacity-0">
        <AuraFrame tier={tier} aura="full" Drawing={TierUpEmblemBody} />
      </div>
      <TierUpDiamantWings tier={tier} />
      {DIAMANT_FACETS.map(({ points, color }, index) => (
        <div
          key={points}
          data-tier-up="facet"
          data-index={index}
          className="absolute inset-0 opacity-0"
        >
          <svg viewBox="0 0 32 32" className={LAYER}>
            <polygon
              points={points}
              fill={paint.facet[color]}
              stroke={paint.outline}
              strokeWidth={0.3}
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ))}
      <svg viewBox="0 0 32 32" className={LAYER}>
        <g data-tier-up="cut">
          <path
            data-tier-up="cut-trace"
            d={`${d} ${GEM_FACETS}`}
            fill="none"
            stroke={paint.flash}
            strokeWidth={0.35}
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
            style={{ filter: `drop-shadow(0 0 0.6px ${paint.flash})` }}
          />
        </g>
        <g data-tier-up="body" opacity={0}>
          {body}
        </g>
        <g data-tier-up="engraving" className={GLINTED} opacity={0}>
          {engraving}
        </g>
        <path data-tier-up="flash" d={d} fill={paint.flash} opacity={0} />
      </svg>
    </div>
  );
};
