import type { Tier } from "ranked";

import { INK, METAL_STOPS, METALS } from "@/components/tier/tier-sprite-paint";

// `color` at `percent` % over `base`: the Tier-up's lights are its metal fading out.
const mix = (color: string, percent: number, base = "transparent") =>
  `color-mix(in srgb, ${color} ${percent}%, ${base})`;

// The paint of a Tier-up, all from the metal of its Tier in the sprite: no colour of its own.
export const tierUpPaint = (tier: Tier) => {
  const metal = METALS[tier];
  const stops = METAL_STOPS.map(([offset, color]) => `${metal[color]} ${offset * 100}%`);

  return {
    light: metal.light,
    mid: metal.mid,
    // The letters of the name: the gradient of the Emblems' metal, top to bottom.
    metal: `linear-gradient(180deg, ${stops.join(", ")})`,
    // The ground behind the stage, the metal barely warming the ink around the Blason.
    ground: `radial-gradient(ellipse 55% 60% at 50% 39%, ${mix(metal.mid, 12, INK)} 0%, ${INK} 72%)`,
    // The light opening behind the Blason as it lands, as far as `reach` (the ellipse's radii)
    // and as strong as `percent`: each Tier-up opens its own.
    bloom: (reach: string, percent: number) =>
      `radial-gradient(ellipse ${reach} at 50% 39%, ${mix(metal.mid, percent)}, ${mix(metal.mid, 0)} 70%)`,
    // The halo right around the Blason, which keeps breathing: its sheen at the heart.
    halo: `radial-gradient(circle, ${mix(metal.sheen, 50)}, ${mix(metal.mid, 0)} 68%)`,
    // The flash of the Emblem's shape as the Blason lands: its light metal, nearly white.
    flash: mix(metal.light, 25, "white"),
    nameShadow: `drop-shadow(0 6px 24px ${mix(metal.sheen, 45)})`,
    // The glow of a spark, `blur` px wide.
    glow: (blur: number) => `0 0 ${blur}px ${metal.mid}`,
    // The glow of a crack of light, as bright as its light.
    crackGlow: `0 0 16px ${metal.light}`,
    // A dashed ring turning around the Blason, at `percent` of its metal.
    orbit: (percent: number) => mix(metal.mid, percent),
  };
};
