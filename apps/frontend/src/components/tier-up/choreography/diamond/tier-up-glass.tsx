import type { Tier } from "ranked";

import { DIAMOND_GLASS } from "@/components/tier-up/choreography/diamond/diamond-lights";
import { TierUpAlongLine } from "@/components/tier-up/parts/tier-up-along-line";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

// A shard: a sliver of a triangle, cut from its box.
const SHARD = "polygon(0 0, 100% 35%, 25% 100%)";

// The shards of glass the impact flings out, as the Platinum → Diamond artboard draws them: each
// flying and spinning along its own line from the Blason's centre, lit at its tip, unseen until it
// leaves.
export const TierUpGlass = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <TierUpCenter>
      {DIAMOND_GLASS.map(({ angle, length, width }, index) => (
        <TierUpAlongLine key={angle} angle={angle}>
          <i
            data-tier-up="glass"
            data-index={index}
            className="absolute top-0 left-0 origin-top-left opacity-0"
            style={{ width: length, height: width, background: paint.glass, clipPath: SHARD }}
          />
        </TierUpAlongLine>
      ))}
    </TierUpCenter>
  );
};
