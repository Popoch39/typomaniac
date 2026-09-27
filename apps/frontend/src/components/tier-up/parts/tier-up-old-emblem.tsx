import type { Tier } from "ranked";

import { TierEmblem } from "@/components/tier/drawing/tier-emblem";

// The Emblem of the Tier left, where the Blason will land: it comes in, then comes apart. The
// wrappers move, never the svg.
export const TierUpOldEmblem = ({ tier }: { tier: Tier }) => (
  <div data-tier-up="old" className="absolute top-[250px] left-[620px] size-[200px]">
    <div data-tier-up="old-dissolve" className="size-full">
      <TierEmblem tier={tier} />
    </div>
  </div>
);
