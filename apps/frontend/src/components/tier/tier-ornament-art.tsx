import { useRef } from "react";
import type { Tier } from "ranked";

import {
  GLOWS,
  glowId,
  metalId,
  ornamentId,
  paint,
  RAYS,
  ref,
} from "@/components/tier/tier-sprite-paint";
import { useOrnamentMotion } from "@/components/tier/use-ornament-motion";

// One Ornament, on the 120 × 120 grid of the svg around it: its own glow from Or up, the Maniac's
// own rays, then its shared symbol from the sprite. The glow and the rays belong to this
// instance, so they can move without moving every other Ornament.
export const TierOrnamentArt = ({ tier }: { tier: Tier }) => {
  const scope = useRef<SVGGElement>(null);
  const glow = GLOWS.find((each) => each.tier === tier);

  useOrnamentMotion(scope);

  return (
    <g ref={scope}>
      {glow === undefined ? null : (
        <circle data-ornament-glow cx={60} cy={60} r={glow.radius} fill={paint(glowId(tier))} />
      )}
      {tier === "maniac" ? (
        <g data-ornament-rays>
          <circle cx={60} cy={60} r={40} {...RAYS} stroke={paint(metalId(tier))} />
        </g>
      ) : null}
      <use href={ref(ornamentId(tier))} width="120" height="120" />
    </g>
  );
};
