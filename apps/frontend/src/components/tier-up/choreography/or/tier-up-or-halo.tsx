import type { Tier } from "ranked";

import { TierUpGlow } from "@/components/tier-up/parts/tier-up-glow";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { TierUpRing } from "@/components/tier-up/parts/tier-up-ring";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

// The light around the Or Emblem, as its artboard draws it: the halo that opens and breathes,
// then the two rings of the impact, the wider one a little later.
export const TierUpOrHalo = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <TierUpCenter>
      <TierUpGlow tier={tier} size={500} />
      <TierUpRing part="ring" size={760} width={3} color={paint.light} />
      <TierUpRing part="ring-wide" size={1040} width={2} color={paint.mid} />
    </TierUpCenter>
  );
};
