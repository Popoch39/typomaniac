import type { Tier } from "ranked";

import { AuraFrame } from "@/components/aura/aura-frame";
import { EMBLEM_LAYERS } from "@/components/tier/sprite/tier-emblem-layers";
import { EMBLEM_OUTLINES, STAR } from "@/components/tier/sprite/tier-emblem-outline";
import { TierUpLaurel } from "@/components/tier-up/choreography/or/tier-up-laurel";
import { TierUpEmblemBody } from "@/components/tier-up/parts/tier-up-emblem-body";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

// A layer of the Emblem, over the others, on its 32 × 32 grid.
const LAYER = "absolute inset-0 size-full overflow-visible";

// The stud of the engraving scaled about its own centre by `--pop`, as the artboard's
// `transform-box: fill-box` does: GSAP moves the variable, never an SVG transform.
const POPPED =
  "[&>circle]:origin-center [&>circle]:[transform-box:fill-box] [&>circle]:[transform:scale(var(--pop,1))]";

// The Emblem of the Tier reached, as the Argent → Or artboard brings it, 320 px: it materializes
// out of a blinding white, squeezed thin then whole, with a flash of its shape; it lands, its full
// Aura lighting up from behind (under the laurels and the metal, never over them), its laurels
// trace themselves around it, its star is traced, then cut, with a flash, and its stud pops in.
// Only seen: the name under it says the Tier. The wrappers move, never the drawing.
export const TierUpMaterializedEmblem = ({ tier }: { tier: Tier }) => {
  const { d } = EMBLEM_OUTLINES[tier];
  const { body, engraving } = EMBLEM_LAYERS[tier];
  const paint = tierUpPaint(tier);

  return (
    <div
      data-tier-up="emblem"
      data-tier={tier}
      aria-hidden
      className="absolute top-[190px] left-[560px] size-[320px]"
    >
      {/* Its body drawn once more over the Aura's canvas, hidden under the one that materializes:
          only the Aura's light shows, from the impact on. */}
      <div data-tier-up="aura" className="absolute inset-0 opacity-0">
        <AuraFrame tier={tier} aura="full" Drawing={TierUpEmblemBody} />
      </div>
      <TierUpLaurel tier={tier} />
      <div data-tier-up="materialize" className="absolute inset-0 opacity-0">
        <svg viewBox="0 0 32 32" className={LAYER}>
          {body}
          <path
            data-tier-up="star-trace"
            d={STAR}
            fill="none"
            stroke={paint.flash}
            strokeWidth={0.35}
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
          />
          <g data-tier-up="engraving" className={POPPED}>
            {engraving}
          </g>
          <path data-tier-up="star-flash" d={STAR} fill={paint.flash} opacity={0} />
          <path data-tier-up="flash" d={d} fill={paint.flash} opacity={0} />
        </svg>
      </div>
    </div>
  );
};
