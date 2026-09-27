import type { Tier } from "ranked";

import {
  deepId,
  INK,
  METAL_STOPS,
  METALS,
  OUTLINES,
  paint,
} from "@/components/tier/sprite/tier-sprite-paint";

// The light under the name: `y` px down, `blur` px wide, as strong as `percent`.
export type NameShadow = { y: number; blur: number; percent: number };

// Which colour of the metal warms the ground, and how much of it: each artboard picks its own.
export type GroundTint = { tint: "mid" | "crease"; percent: number };

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
    // The ground behind the stage, the metal (`tint` of it, as much as `percent`) barely warming
    // the ink around the Blason.
    ground: ({ tint, percent }: GroundTint) =>
      `radial-gradient(ellipse 55% 60% at 50% 39%, ${mix(metal[tint], percent, INK)} 0%, ${INK} 72%)`,
    // The light opening behind the Blason as it lands, as far as `reach` (the ellipse's radii)
    // and as strong as `percent`: each Tier-up opens its own.
    bloom: (reach: string, percent: number) =>
      `radial-gradient(ellipse ${reach} at 50% 39%, ${mix(metal.mid, percent)}, ${mix(metal.mid, 0)} 70%)`,
    // The halo right around the Blason, which keeps breathing: its sheen at the heart.
    halo: `radial-gradient(circle, ${mix(metal.sheen, 50)}, ${mix(metal.mid, 0)} 68%)`,
    // The flash of the Emblem's shape as the Blason lands: its light metal, nearly white.
    flash: mix(metal.light, 25, "white"),
    nameShadow: ({ y, blur, percent }: NameShadow) =>
      `drop-shadow(0 ${y}px ${blur}px ${mix(metal.sheen, percent)})`,
    // The crease of the metal, and the outline around it: the laurels' stems and leaves.
    crease: metal.crease,
    outline: OUTLINES[tier],
    // A leaf of the laurels: the sprite's deeper metal of the Tier, drawn for its Ornament.
    leaf: paint(deepId(tier)),
    // Rays of light turning slowly around the Blason, fading away from it.
    rays: `repeating-conic-gradient(from 0deg, ${mix(metal.mid, 0)} 0deg 7deg, ${mix(metal.light, 20)} 10deg, ${mix(metal.mid, 0)} 13deg 20deg)`,
    // The column of light the old Emblem rises into: white at its heart.
    column: `linear-gradient(90deg, ${mix(metal.mid, 0)}, ${mix(metal.light, 85)} 44%, white 50%, ${mix(metal.light, 85)} 56%, ${mix(metal.mid, 0)})`,
    // The whole stage going white as the Blason materializes, from its centre.
    whiteout: `radial-gradient(circle at 50% 39%, ${mix(metal.light, 25, "white")} 0%, ${mix(metal.light, 60)} 25%, ${mix(metal.mid, 0)} 60%)`,
    // A piece of glitter, lit at its corner, and its glow.
    glitter: `linear-gradient(135deg, ${metal.light}, ${metal.mid} 60%, ${metal.crease})`,
    glitterGlow: `0 0 8px ${mix(metal.mid, 80)}`,
    // The glow of a spark, `blur` px wide, spread by `spread` px.
    glow: (blur: number, spread = 0) => `0 0 ${blur}px ${spread}px ${metal.mid}`,
    // The lines of a grid of light, faint.
    grid: mix(metal.mid, 20),
    // A plume of light rising behind the Blason, fading out from its heart.
    plume: `radial-gradient(ellipse at center, ${mix(metal.sheen, 28)}, ${mix(metal.mid, 0)} 70%)`,
    // The glow of a crack of light, as bright as its light.
    crackGlow: `0 0 16px ${metal.light}`,
    // A dashed ring turning around the Blason, at `percent` of its metal.
    orbit: (percent: number) => mix(metal.mid, percent),
  };
};
