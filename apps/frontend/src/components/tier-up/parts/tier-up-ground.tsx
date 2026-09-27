import type { Tier } from "ranked";

import { type GroundTint, tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

// How far the light opening behind the Blason reaches (the ellipse's radii) and how strong it is:
// each artboard opens its own.
export type Bloom = { reach: string; percent: number };

// The ink warmed by 12 % of the metal, unless the artboard warms it otherwise.
const WARMED: GroundTint = { tint: "mid", percent: 12 };

type TierUpGroundProps = { tier: Tier; bloom: Bloom; ground?: GroundTint };

// The stage's ground, the ink warmed by the Tier's metal around the Blason, and the light that
// opens behind it as it lands.
export const TierUpGround = ({ tier, bloom, ground = WARMED }: TierUpGroundProps) => {
  const paint = tierUpPaint(tier);

  return (
    <>
      <div
        data-tier-up="ground"
        className="absolute inset-0"
        style={{ background: paint.ground(ground) }}
      />
      <div
        data-tier-up="bloom"
        className="absolute inset-0 opacity-0"
        style={{ background: paint.bloom(bloom.reach, bloom.percent) }}
      />
    </>
  );
};
