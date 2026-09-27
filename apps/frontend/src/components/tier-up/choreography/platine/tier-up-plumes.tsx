import type { Tier } from "ranked";

import { PLATINE_PLUMES } from "@/components/tier-up/choreography/platine/platine-lights";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

// The plumes of light rising behind the Blason, soft and blurred, unseen until each rises. Each on
// a layer of its own: its blur is drawn once, not at every frame of its rise.
export const TierUpPlumes = ({ tier }: { tier: Tier }) => {
  const { plume } = tierUpPaint(tier);

  return (
    <>
      {PLATINE_PLUMES.map(({ left }, index) => (
        <div
          key={left}
          data-tier-up="plume"
          data-index={index}
          className="absolute top-[300px] h-[380px] w-[180px] rounded-full opacity-0 blur-[14px] will-change-transform"
          style={{ left, background: plume }}
        />
      ))}
    </>
  );
};
