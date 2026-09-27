import type { Tier } from "ranked";

import type { TierUpSpark } from "@/components/tier-up/parts/spark-burst";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

type TierUpSparksProps = {
  tier: Tier;
  sparks: readonly TierUpSpark[];
  // How wide each spark glows, in px.
  glow: number;
};

// The sparks of the impact, each a dot of the Tier's light, unseen until it flies out of the
// Blason's centre.
export const TierUpSparks = ({ tier, sparks, glow }: TierUpSparksProps) => {
  const paint = tierUpPaint(tier);

  return (
    <TierUpCenter>
      {sparks.map(({ x, y, size }) => (
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
            boxShadow: paint.glow(glow),
          }}
        />
      ))}
    </TierUpCenter>
  );
};
