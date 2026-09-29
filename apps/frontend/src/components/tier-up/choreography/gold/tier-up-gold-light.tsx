import type { Tier } from "ranked";

import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

// The rays fade out this far from the Blason.
const RAYS_MASK = "radial-gradient(circle, black 8%, transparent 60%)";

// The light of the Silver → Gold artboard that the strike does not shake: the rays around the
// Blason, turning slowly from the start as in the artboard, unseen until they fade in at the
// impact, and the column of light the silver rises into, closed until it opens.
export const TierUpGoldLight = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <>
      <TierUpCenter>
        <div
          data-tier-up="rays"
          className="absolute -top-[700px] -left-[700px] size-[1400px] opacity-0"
        >
          <div
            className="size-full rounded-full"
            style={{ background: paint.rays, maskImage: RAYS_MASK }}
          />
        </div>
      </TierUpCenter>
      <div
        data-tier-up="column"
        className="absolute top-0 left-[640px] h-[900px] w-[160px] opacity-0 blur-[6px]"
        style={{ background: paint.column, transform: "scaleX(0)" }}
      />
    </>
  );
};
