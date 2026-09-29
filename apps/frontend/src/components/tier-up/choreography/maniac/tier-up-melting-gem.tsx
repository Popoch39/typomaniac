import type { Tier } from "ranked";

import { DIAMOND_FACETS } from "@/components/tier-up/choreography/diamond/diamond-facets";
import { MANIAC_CRACKS } from "@/components/tier-up/choreography/maniac/maniac-cracks";
import { FIRE } from "@/components/tier-up/choreography/maniac/maniac-paint";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { EMBLEM_OUTLINES } from "@/components/tier/sprite/tier-emblem-outline";

// A layer of the gem, over the others, on its 32 × 32 grid.
const LAYER = "absolute inset-0 size-full overflow-visible";

// The Emblem of the Tier left, the Diamond's gem, as the Diamond → Maniac artboard melts it, 240 px,
// a little under the Blason's centre: its eight facets over its dark shape, heating up more and
// more, trembling as cracks of white heat run through it, then flung apart. Only seen: the
// name says the Tier reached. The wrappers move, never the drawing.
export const TierUpMeltingGem = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <div
      data-tier-up="old"
      data-tier={tier}
      aria-hidden
      className="absolute top-[250px] left-[600px] size-[240px] opacity-0"
    >
      <div data-tier-up="old-tremble" className="size-full">
        <div data-tier-up="old-heat" className="relative size-full">
          <svg data-tier-up="gem" viewBox="0 0 32 32" className={LAYER}>
            <path
              d={EMBLEM_OUTLINES[tier].d}
              fill={paint.outline}
              stroke={paint.outline}
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
          </svg>
          {DIAMOND_FACETS.map(({ points, color }, index) => (
            <div
              key={points}
              data-tier-up="gem-facet"
              data-index={index}
              className="absolute inset-0"
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
          <svg data-tier-up="cracks" viewBox="0 0 32 32" className={LAYER}>
            {MANIAC_CRACKS.map(({ d, width }, index) => (
              <path
                key={d}
                data-tier-up="crack"
                data-index={index}
                d={d}
                fill="none"
                stroke={FIRE.white}
                strokeWidth={width}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};
