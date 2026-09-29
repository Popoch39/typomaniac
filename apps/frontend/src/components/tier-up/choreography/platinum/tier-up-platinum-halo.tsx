import type { Tier } from "ranked";

import { TierUpBeadedOrbit } from "@/components/tier-up/choreography/platinum/tier-up-beaded-orbit";
import { TierUpGlow } from "@/components/tier-up/parts/tier-up-glow";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { TierUpRing } from "@/components/tier-up/parts/tier-up-ring";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

// The light around the Platinum Emblem, as its artboard draws it: the halo that opens and
// breathes, the beaded ring that will turn, then the two rings of the impact, the wider one a
// little later.
export const TierUpPlatinumHalo = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <TierUpCenter>
      <TierUpGlow tier={tier} size={520} />
      <TierUpBeadedOrbit tier={tier} />
      <TierUpRing part="ring" size={800} width={3} color={paint.light} />
      <TierUpRing part="ring-wide" size={1120} width={2} color={paint.mid} />
    </TierUpCenter>
  );
};
