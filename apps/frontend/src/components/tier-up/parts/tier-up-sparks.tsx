import type { Tier } from "ranked";

import type { TierUpSpark } from "@/components/tier-up/parts/spark-burst";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

// The colours of a spark: its own, and the one it glows in.
type SparkLight = { color: string; halo: string };

type TierUpSparksProps = {
  tier: Tier;
  sparks: readonly TierUpSpark[];
  // How wide each spark glows, in px.
  glow: number;
  // Its name for the timeline: `spark`, unless the scene has several bursts.
  name?: string;
  // The Tier's light glowing in its metal, unless its artboard lights the sparks otherwise.
  light?: SparkLight;
};

// The sparks of the impact, each a dot of the Tier's light, unseen until it flies out of the
// Blason's centre.
export const TierUpSparks = ({ tier, sparks, glow, name = "spark", light }: TierUpSparksProps) => {
  const paint = tierUpPaint(tier);
  const { color, halo } = light ?? { color: paint.light, halo: paint.mid };

  return (
    <TierUpCenter>
      {sparks.map(({ x, y, size }) => (
        <i
          key={`${x} ${y}`}
          data-tier-up={name}
          className="absolute rounded-full opacity-0"
          style={{
            left: -size / 2,
            top: -size / 2,
            width: size,
            height: size,
            background: color,
            boxShadow: `0 0 ${glow}px ${halo}`,
          }}
        />
      ))}
    </TierUpCenter>
  );
};
