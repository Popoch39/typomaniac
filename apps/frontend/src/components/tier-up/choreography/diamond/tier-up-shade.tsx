import type { Tier } from "ranked";

import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { BEYOND_STAGE } from "@/components/tier-up/stage/beyond-stage";

// What lies over the ground of the Platinum → Diamond artboard, unseen until each fades in: the
// hazes of the metal that drift in after the impact, and the stage darkening all around the
// Platinum as it implodes, then clearing for the gem, as dark past its edges as on them.
export const TierUpShade = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <>
      <div
        data-tier-up="haze"
        className="absolute inset-0 opacity-0"
        style={{ background: paint.haze }}
      />
      <div
        data-tier-up="vignette"
        className="absolute opacity-0"
        style={{ ...BEYOND_STAGE.box, background: paint.vignette }}
      />
    </>
  );
};
