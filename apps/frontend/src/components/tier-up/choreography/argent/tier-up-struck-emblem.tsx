import type { Tier } from "ranked";

import { AuraFrame } from "@/components/aura/aura-frame";
import { EMBLEM_LAYERS } from "@/components/tier/sprite/tier-emblem-layers";
import { EMBLEM_OUTLINES } from "@/components/tier/sprite/tier-emblem-outline";
import { TIER_UP_SHARDS } from "@/components/tier-up/choreography/argent/tier-up-shards";
import { TierUpSheenBand } from "@/components/tier-up/parts/tier-up-sheen-band";
import { TierUpEmblemBody } from "@/components/tier-up/parts/tier-up-emblem-body";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

// A layer of the Emblem, over the others, on its 32 × 32 grid.
const LAYER = "absolute inset-0 size-full overflow-visible";

// The seams between the shards, across and down the Emblem.
const SEAMS = "M16 1 V31 M2.5 15.5 H29.5";

// Each piece of the engraving scaled about its own centre by `--stamp`, as the artboard's
// `transform-box: fill-box` does: GSAP moves the variable, never an SVG transform.
const STAMPED =
  "[&>g]:origin-center [&>g]:[transform-box:fill-box] [&>g]:[transform:scale(var(--stamp,1))]";

// The Emblem of the Tier reached, as the Bronze → Argent artboard strikes it, 320 px: its
// quarters fly in and meet, it lands whole with a flash along their seams and of its shape
// (its body in its full Aura where its Tier has one), each chevron is stamped in, then a light
// sweeps over the metal. Only seen: the name under it says the Tier. The wrappers move, never
// the drawing.
export const TierUpStruckEmblem = ({ tier }: { tier: Tier }) => {
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
      {TIER_UP_SHARDS.map(({ clip: quarter }) => (
        <div
          key={quarter}
          data-tier-up="shard"
          className="absolute inset-0 opacity-0"
          style={{ clipPath: quarter }}
        >
          <svg viewBox="0 0 32 32" className={LAYER}>
            {body}
          </svg>
        </div>
      ))}
      <div data-tier-up="fill" className="absolute inset-0 opacity-0">
        <AuraFrame tier={tier} aura="full" Drawing={TierUpEmblemBody} />
      </div>
      <svg viewBox="0 0 32 32" className={LAYER}>
        <path
          data-tier-up="seams"
          d={SEAMS}
          fill="none"
          stroke={paint.light}
          strokeWidth={0.4}
          opacity={0}
        />
        {/* Each chevron scales about its own centre by `--stamp`, which the timeline moves. */}
        <g data-tier-up="engraving" className={STAMPED}>
          {engraving}
        </g>
        <TierUpSheenBand tier={tier} d={d} />
        <path data-tier-up="flash" d={d} fill={paint.flash} opacity={0} />
      </svg>
    </div>
  );
};
