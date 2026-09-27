import type { Tier } from "ranked";

import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

// How far the light opening behind the Blason reaches (the ellipse's radii) and how strong it is:
// each artboard opens its own.
export type Bloom = { reach: string; percent: number };

// The stage's ground, the ink warmed by the Tier's metal around the Blason, and the light that
// opens behind it as it lands.
export const TierUpGround = ({ tier, bloom }: { tier: Tier; bloom: Bloom }) => {
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
        style={{ background: paint.bloom(bloom.reach, bloom.percent) }}
      />
    </>
  );
};
