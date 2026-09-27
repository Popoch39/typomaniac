import type { Tier } from "ranked";

import { TierUpCenter } from "@/components/tier-up/tier-up-center";
import { TierUpGlow } from "@/components/tier-up/tier-up-glow";
import { TierUpOrbit } from "@/components/tier-up/tier-up-orbit";
import { tierUpPaint } from "@/components/tier-up/tier-up-paint";
import { TierUpRing } from "@/components/tier-up/tier-up-ring";

// The light around the Argent Emblem, as its artboard draws it: two dashed rings that will turn
// against each other, the halo that opens and breathes, the two rings of the strike, then the
// two small ones of the chevrons stamped in.
export const TierUpArgentHalo = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <TierUpCenter>
      <TierUpOrbit part="orbit" size={460} width={1.5} color={paint.orbit(40)} />
      <TierUpOrbit part="orbit-back" size={570} width={1} color={paint.orbit(22)} />
      <TierUpGlow tier={tier} size={480} />
      <TierUpRing part="ring" size={720} width={3} color={paint.light} />
      <TierUpRing part="ring-wide" size={920} width={1.5} color={paint.mid} />
      <TierUpRing part="ring-stamp-1" size={400} width={2} color={paint.light} />
      <TierUpRing part="ring-stamp-2" size={400} width={2} color={paint.light} />
    </TierUpCenter>
  );
};
