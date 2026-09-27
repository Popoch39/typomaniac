import type { Tier } from "ranked";

import { BLASON_CENTRE } from "@/components/tier-up/stage/blason-centre";
import { TierEmblem } from "@/components/tier/drawing/tier-emblem";

// The Emblem of the Tier left, `size` px (200, unless its artboard draws it larger), where the
// Blason will land: it comes in, then comes apart. The wrappers move, never the svg.
export const TierUpOldEmblem = ({ tier, size = 200 }: { tier: Tier; size?: number }) => (
  <div
    data-tier-up="old"
    className="absolute"
    style={{
      left: BLASON_CENTRE.x - size / 2,
      top: BLASON_CENTRE.y - size / 2,
      width: size,
      height: size,
    }}
  >
    <div data-tier-up="old-dissolve" className="size-full">
      <TierEmblem tier={tier} />
    </div>
  </div>
);
