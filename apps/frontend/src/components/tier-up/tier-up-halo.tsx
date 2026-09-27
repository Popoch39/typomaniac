import type { Tier } from "ranked";

import { TierUpCenter } from "@/components/tier-up/tier-up-center";
import { TierUpGlow } from "@/components/tier-up/tier-up-glow";
import { tierUpPaint } from "@/components/tier-up/tier-up-paint";
import { TierUpRing } from "@/components/tier-up/tier-up-ring";

// The light around the Bronze Emblem: the halo, unseen until it opens at the impact and then
// breathes, and the ring that flies out of it, small and lit behind the old Emblem until then,
// as in the canvas.
export const TierUpHalo = ({ tier }: { tier: Tier }) => (
  <TierUpCenter>
    <TierUpGlow tier={tier} size={460} />
    <TierUpRing part="ring" size={640} width={2} color={tierUpPaint(tier).light} />
  </TierUpCenter>
);
