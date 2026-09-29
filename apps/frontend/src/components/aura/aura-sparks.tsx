import type { Tier } from "ranked";

import { SPARKS } from "@/components/aura/aura-paint";
import { GLINT, HOT_ID, paint, ref, SPARK_ID } from "@/components/tier/sprite/tier-sprite-paint";

// The Maniac's sparks burn, the Diamond's glint white.
const sparkPaint = (tier: Tier) => (tier === "maniac" ? { fill: paint(HOT_ID) } : GLINT);

// The sparks around one Ornament, unlit until they twinkle (`data-aura-spark`, growing around
// their centre as they light up): still and unseen under reduced motion. None below Diamond.
export const AuraSparks = ({ tier }: { tier: Tier }) => {
  const sparks = SPARKS[tier];

  if (sparks === undefined) {
    return null;
  }

  return sparks.map(([x, y, scale]) => (
    <g key={`${x} ${y}`} transform={`translate(${x} ${y}) scale(${scale})`}>
      <use data-aura-spark href={ref(SPARK_ID)} {...sparkPaint(tier)} opacity={0} />
    </g>
  ));
};
