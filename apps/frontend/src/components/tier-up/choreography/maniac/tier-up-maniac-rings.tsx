import type { Tier } from "ranked";

import { FIRE, MANIAC_PAINT } from "@/components/tier-up/choreography/maniac/maniac-paint";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { TierUpRing } from "@/components/tier-up/parts/tier-up-ring";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

// How far under the crown's centre the rings of its quake spread over the floor (px).
const FLOOR = 160;

// The rings around the Maniac's crown that the quakes shake, as its artboard draws them, over the
// vortex: the ring of the gem breaking; the three rings of the quake, two of them spreading over
// the floor; the two gusts of fire as it catches.
export const TierUpManiacRings = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <TierUpCenter>
      <TierUpRing part="ring" size={660} width={2} color={MANIAC_PAINT.ring} />
      <TierUpRing part="floor" size={1040} height={180} below={FLOOR} width={4} color={FIRE.gold} />
      <TierUpRing
        part="floor-wide"
        size={1520}
        height={240}
        below={FLOOR}
        width={2}
        color={MANIAC_PAINT.floorWide}
      />
      <TierUpRing part="ring-wide" size={880} width={3} color={paint.mid} />
      <TierUpRing part="gust" size={1520} width={70} blur={10} color={MANIAC_PAINT.gust} />
      <TierUpRing part="gust-wide" size={1800} width={3} color={MANIAC_PAINT.gustWide} />
    </TierUpCenter>
  );
};
