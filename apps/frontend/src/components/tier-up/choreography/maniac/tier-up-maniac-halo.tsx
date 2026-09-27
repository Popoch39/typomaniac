import type { Tier } from "ranked";

import { MANIAC_PAINT } from "@/components/tier-up/choreography/maniac/maniac-paint";
import { TierUpGlow } from "@/components/tier-up/parts/tier-up-glow";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

// The halo of fire around the Maniac's crown, as its artboard draws it: it opens as the crown
// lands, then breathes. Under the vortex and the rings.
export const TierUpManiacHalo = ({ tier }: { tier: Tier }) => (
  <TierUpCenter>
    <TierUpGlow tier={tier} size={640} light={MANIAC_PAINT.halo} />
  </TierUpCenter>
);
