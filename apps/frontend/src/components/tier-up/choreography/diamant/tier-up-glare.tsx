import type { Tier } from "ranked";

import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { BEYOND_STAGE } from "@/components/tier-up/stage/beyond-stage";

// The light of the Platine → Diamant impact over the whole stage, unseen until the gem slams
// down: a white more blinding than a whiteout, from the Blason's centre, fading out past the
// stage's edges as it does on them; a line of light across
// the stage, stretching as it fades; and a thin beam down it.
export const TierUpGlare = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <>
      <div
        data-tier-up="whiteout"
        className="absolute opacity-0"
        style={{ ...BEYOND_STAGE.box, background: paint.glare }}
      />
      <div
        data-tier-up="horizon"
        className="absolute top-[346px] -left-20 h-2 w-[1600px] rounded-[4px] opacity-0 blur-[1.5px]"
        style={{ background: paint.horizon }}
      />
      <div
        data-tier-up="beam"
        className="absolute top-[110px] left-[719px] h-[480px] w-0.5 opacity-0"
        style={{ background: paint.beam }}
      />
    </>
  );
};
