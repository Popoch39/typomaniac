import type { Tier } from "ranked";

import { TIER_UP_SPARKS } from "@/components/tier-up/spark-burst";
import { TierUpCenter } from "@/components/tier-up/tier-up-center";
import { tierUpPaint } from "@/components/tier-up/tier-up-paint";

// The sparks of the impact, each a dot of the Tier's light, unseen until it flies out of the
// Blason's centre.
export const TierUpSparks = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <TierUpCenter>
      {TIER_UP_SPARKS.map(({ x, y, size }) => (
        <i
          key={`${x} ${y}`}
          data-tier-up="spark"
          className="absolute rounded-full opacity-0"
          style={{
            left: -size / 2,
            top: -size / 2,
            width: size,
            height: size,
            background: paint.light,
            boxShadow: paint.sparkGlow,
          }}
        />
      ))}
    </TierUpCenter>
  );
};
