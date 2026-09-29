import type { Tier } from "ranked";

import { DIAMOND_TWINKLES } from "@/components/tier-up/choreography/diamond/diamond-lights";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";
import { ref, SPARK_ID } from "@/components/tier/sprite/tier-sprite-paint";

// The stars twinkling around the Blason while the Tier-up waits, as the Platinum → Diamond
// artboard scatters them: each a spark of the sprite, 24 px, in the Tier's light, unseen until it
// first twinkles.
export const TierUpTwinkles = ({ tier }: { tier: Tier }) => {
  const { light } = tierUpPaint(tier);

  return (
    <TierUpCenter>
      {DIAMOND_TWINKLES.map(({ x, y }, index) => (
        <div
          key={`${x} ${y}`}
          data-tier-up="twinkle"
          data-index={index}
          className="absolute -mt-3 -ml-3 size-6 opacity-0"
          style={{ left: x, top: y }}
        >
          <svg viewBox="-6 -6 12 12" className="size-full">
            <use href={ref(SPARK_ID)} fill={light} />
          </svg>
        </div>
      ))}
    </TierUpCenter>
  );
};
