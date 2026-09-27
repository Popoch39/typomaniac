import { useRef } from "react";
import type { Tier } from "ranked";

import { shines } from "@/components/aura/aura-paint";
import { AuraSheen } from "@/components/aura/aura-sheen";
import { AuraSparks } from "@/components/aura/aura-sparks";
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
// own rays, its shared symbol from the sprite, then its light Aura over the metal (a sheen from
// Or up, sparks for the Diamant and the Maniac). All but the symbol belong to this instance, so
// they can move without moving every other Ornament. Without `glow` where the full Aura draws its
// own light behind: neither the glow nor the sparks, which its shader draws.
export const TierOrnamentArt = ({ tier, glow }: { tier: Tier; glow: boolean }) => {
  const scope = useRef<SVGGElement>(null);
  const halo = glow ? GLOWS.find((each) => each.tier === tier) : undefined;

  useOrnamentMotion(scope);

  return (
    <g ref={scope}>
      {halo === undefined ? null : (
        <circle data-ornament-glow cx={60} cy={60} r={halo.radius} fill={paint(glowId(tier))} />
      )}
      {tier === "maniac" ? (
        <g data-ornament-rays>
          <circle cx={60} cy={60} r={40} {...RAYS} stroke={paint(metalId(tier))} />
        </g>
      ) : null}
      <use href={ref(ornamentId(tier))} width="120" height="120" />
      {shines(tier) ? <AuraSheen tier={tier} /> : null}
      {glow ? <AuraSparks tier={tier} /> : null}
    </g>
  );
};
