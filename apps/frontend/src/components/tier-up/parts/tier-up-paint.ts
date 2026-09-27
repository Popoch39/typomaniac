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
export type GroundTint = { tint: "mid" | "crease" | "outline"; percent: number };

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
    // The ground behind the stage, the metal (`tint` of it, or its outline, as much as `percent`)
    // barely warming the ink around the Blason.
    ground: ({ tint, percent }: GroundTint) =>
      `radial-gradient(ellipse 55% 60% at 50% 39%, ${mix(tint === "outline" ? OUTLINES[tier] : metal[tint], percent, INK)} 0%, ${INK} 72%)`,
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
    sheen: metal.sheen,
    // The stage darkened all around the Blason, nearly black at its edges.
    vignette: `radial-gradient(ellipse 50% 55% at 50% 39%, ${mix(INK, 0)} 20%, ${mix(INK, 25, "black")} 80%)`,
    // Two hazes of the metal drifting over the ground, off the Blason, up left and down right.
    haze: `radial-gradient(ellipse 30% 36% at 34% 30%, ${mix(metal.mid, 22)}, transparent 70%), radial-gradient(ellipse 34% 30% at 68% 58%, ${mix(metal.sheen, 16)}, transparent 70%)`,
    // Rays of light around the Blason: fine ones, close together, and broad ones, far apart.
    fineRays: `repeating-conic-gradient(from 0deg, ${mix(metal.mid, 0)} 0deg 6deg, ${mix(metal.sheen, 22)} 8deg, ${mix(metal.mid, 0)} 10deg 15deg)`,
    broadRays: `repeating-conic-gradient(from 4deg, ${mix(metal.mid, 0)} 0deg 20deg, ${mix(metal.light, 14)} 22deg, ${mix(metal.mid, 0)} 24deg 36deg)`,
    // A heart of light: white at its core, then the metal's glow.
    core: `radial-gradient(circle, white 30%, ${mix(metal.mid, 60)} 60%, ${mix(metal.mid, 0)} 72%)`,
    coreGlow: `0 0 40px 12px ${mix(metal.mid, 60)}`,
    // A streak of light, white at its head, fading into the metal along its tail.
    streak: `linear-gradient(90deg, white, ${mix(metal.mid, 0)})`,
    // A shard of glass, lit at its tip.
    glass: `linear-gradient(160deg, ${metal.light}, ${metal.sheen} 50%, ${metal.crease})`,
    // The whole stage blinded white from the Blason's centre, further than a whiteout.
    glare: `radial-gradient(circle at 50% 39%, white 0%, ${mix(metal.light, 90)} 30%, ${mix(metal.mid, 30)} 65%, ${mix(metal.mid, 0)} 100%)`,
    // A line of light across the stage, white at its heart, and one down it.
    horizon: `linear-gradient(90deg, ${mix(metal.mid, 0)}, ${mix(metal.mid, 80)} 38%, white 50%, ${mix(metal.mid, 80)} 62%, ${mix(metal.mid, 0)})`,
    beam: `linear-gradient(180deg, ${mix(metal.mid, 0)}, white 50%, ${mix(metal.mid, 0)})`,
    // The colours of the facets a gem is cut into, from its lightest down to its crease.
    facet: {
      light: metal.light,
      pale: mix(metal.light, 65, metal.sheen),
      frost: mix(metal.light, 30, metal.sheen),
      sheen: metal.sheen,
      mid: metal.mid,
      deep: mix(metal.mid, 50, metal.crease),
      crease: metal.crease,
    },
  };
};

// The light split as through a prism: the red and the cyan fringes the Diamant's name leaves on
// either side as it slams in. The one light of the Tier-up that is not its metal's: a prism's.
export const PRISM = { left: "#ff5a7a", right: "#4dd2ff" } as const;
