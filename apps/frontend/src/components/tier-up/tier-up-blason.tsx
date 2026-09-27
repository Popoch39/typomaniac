import type { Tier } from "ranked";

import { tierUpPaint } from "@/components/tier-up/tier-up-paint";
import { TierBlason } from "@/components/tier/tier-blason";
import { EMBLEM_OUTLINES } from "@/components/tier/tier-emblem-outline";

// The Blason of the Tier reached, where the old Emblem stood: its Emblem's outline traces itself
// in light, the Blason fills it in with its full Aura where its Tier has one (the light one
// otherwise, or if refused), a flash of the Emblem's shape, then it lands. Only seen: the name
// under it says the Tier. The wrappers move, never the Blason's svg.
export const TierUpBlason = ({ tier }: { tier: Tier }) => {
  const { d, transform } = EMBLEM_OUTLINES[tier];
  const paint = tierUpPaint(tier);

  return (
    <div
      data-tier-up="blason"
      aria-hidden
      className="absolute top-[140px] left-[510px] size-[420px]"
    >
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full overflow-visible">
        <path
          data-tier-up="outline"
          d={d}
          transform={transform}
          fill="none"
          stroke={paint.light}
          strokeWidth={0.6}
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
        />
      </svg>
      <div data-tier-up="fill" className="absolute inset-0">
        <TierBlason tier={tier} aura="full" />
      </div>
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full overflow-visible">
        <path data-tier-up="flash" d={d} transform={transform} fill="#fff" opacity={0} />
      </svg>
    </div>
  );
};
