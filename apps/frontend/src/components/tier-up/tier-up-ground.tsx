import type { Tier } from "ranked";

import { tierUpPaint } from "@/components/tier-up/tier-up-paint";

// The stage's ground, the ink warmed by the Tier's metal around the Blason, and the light that
// opens behind it as it lands.
export const TierUpGround = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <>
      <div
        data-tier-up="ground"
        className="absolute inset-0"
        style={{ background: paint.ground }}
      />
      <div
        data-tier-up="bloom"
        className="absolute inset-0 opacity-0"
        style={{ background: paint.bloom }}
      />
    </>
  );
};
