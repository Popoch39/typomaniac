import type { Tier } from "ranked";

import type { TierUpGlitterPiece } from "@/components/tier-up/parts/glitter-rain";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

// The glitter raining over the stage, each piece of the Tier's metal, unseen until it falls from
// just above the top.
type TierUpGlitterProps = { tier: Tier; glitter: readonly TierUpGlitterPiece[] };

export const TierUpGlitter = ({ tier, glitter }: TierUpGlitterProps) => {
  const paint = tierUpPaint(tier);

  return (
    <div className="absolute inset-0">
      {glitter.map(({ left, size }) => (
        <i
          key={left}
          data-tier-up="glitter"
          className="absolute -top-[30px] opacity-0"
          style={{
            left,
            width: size,
            height: size,
            background: paint.glitter,
            boxShadow: paint.glitterGlow,
          }}
        />
      ))}
    </div>
  );
};
