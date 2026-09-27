import type { Tier } from "ranked";

import { TierUpGlow } from "@/components/tier-up/parts/tier-up-glow";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { TierUpRing } from "@/components/tier-up/parts/tier-up-ring";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

// The light around the Diamant Emblem that the impact shakes, as its artboard draws it: the halo
// that opens and breathes, then the three rings of the impact, each wider and a little later.
export const TierUpDiamantHalo = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <TierUpCenter>
      <TierUpGlow tier={tier} size={560} />
      <TierUpRing part="ring" size={720} width={4} color={paint.flash} />
      <TierUpRing part="ring-mid" size={960} width={2.5} color={paint.sheen} />
      <TierUpRing part="ring-wide" size={1280} width={1.5} color={paint.mid} />
    </TierUpCenter>
  );
};
