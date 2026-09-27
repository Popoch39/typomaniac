import type { Tier } from "ranked";

import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

// The rays fade out this far from the Blason: the fine ones sooner than the broad ones.
const FINE_MASK = "radial-gradient(circle, black 6%, transparent 58%)";

const BROAD_MASK = "radial-gradient(circle, black 5%, transparent 60%)";

// The two wheels of rays around the Blason, as the Platine → Diamant artboard draws them: fine
// rays close together, then broad ones, turning against each other from the start as in the
// artboard, unseen until each fades in after the impact.
export const TierUpDiamantRays = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <TierUpCenter>
      <div
        data-tier-up="rays"
        className="absolute -top-[800px] -left-[800px] size-[1600px] opacity-0"
      >
        <div
          className="size-full rounded-full"
          style={{ background: paint.fineRays, maskImage: FINE_MASK }}
        />
      </div>
      <div
        data-tier-up="rays-back"
        className="absolute -top-[560px] -left-[560px] size-[1120px] opacity-0"
      >
        <div
          className="size-full rounded-full"
          style={{ background: paint.broadRays, maskImage: BROAD_MASK }}
        />
      </div>
    </TierUpCenter>
  );
};
