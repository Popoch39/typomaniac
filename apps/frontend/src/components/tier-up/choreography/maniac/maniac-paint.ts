import { STAGE } from "@/components/tier-up/stage/stage-scale";
import { INK, METALS } from "@/components/tier/sprite/tier-sprite-paint";

// The fire of the Diamant → Maniac artboard, from white-hot down to the red of what burns: hotter
// and redder than the Maniac's metal and than the sprite's fire (`HOT`), neither of which has it.
// With `PRISM`, the one light of the Tier-up that is not its metal's, as the artboard wants it.
export const FIRE = {
  white: "#fff3c4",
  pale: "#fff0c2",
  spark: "#ffd08a",
  ember: "#ffc47a",
  gold: "#ffb347",
  red: "#ff6a3d",
  blaze: "#ff5a36",
  char: "#d9432a",
} as const;

const METAL = METALS.maniac;

// The gradients the crown's fire is painted with in the Tier-up, down its height: its gems,
// white-hot down to red, its flame, red at its tip down to white-hot at its foot, and the flame's
// white-hot heart. Their ids are the Tier-up's own: one Tier-up at a time.
export const CROWN_FIRE = {
  heart: {
    id: "tier-up-flame-heart",
    stops: [
      [0, FIRE.white],
      [1, FIRE.white],
    ],
  },
  gems: {
    id: "tier-up-gem-fire",
    stops: [
      [0, FIRE.white],
      [0.45, FIRE.gold],
      [1, FIRE.blaze],
    ],
  },
  flame: {
    id: "tier-up-flame-fire",
    stops: [
      [0, FIRE.blaze],
      [0.55, FIRE.gold],
      [1, FIRE.white],
    ],
  },
} as const;

// `color` at `percent` % over `base`, as the Tier-up mixes all its lights.
const mix = (color: string, percent: number, base = "transparent") =>
  `color-mix(in srgb, ${color} ${percent}%, ${base})`;

// A radial light drawn on the box reaching past the stage (`BEYOND_STAGE`, one stage wider each
// way), as the canvas draws it on the stage: its ellipse's radii and its centre as shares of the
// stage, then its stops.
const beyond = (reach: [number, number], [x, y]: [number, number], stops: string) =>
  `radial-gradient(ellipse ${STAGE.width * reach[0]}px ${STAGE.height * reach[1]}px at ${STAGE.width * (1 + x)}px ${STAGE.height * (1 + y)}px, ${stops})`;

// The ink nearly black, where the silence darkens the stage.
const HUSHED = mix(mix(INK, 25, "black"), 90);

// The paint of the Maniac's Tier-up: its fire, and its metal where the artboard lights with it.
export const MANIAC_PAINT = {
  // The heat rising from under the stage, then flickering over it.
  heat: beyond([0.7, 0.45], [0.5, 1.15], `${mix(FIRE.red, 50)}, ${mix(FIRE.red, 0)} 70%`),
  heatFlicker: beyond([0.6, 0.35], [0.5, 1.12], `${mix(FIRE.gold, 35)}, ${mix(FIRE.gold, 0)} 70%`),
  // The silence: the stage going nearly black around the vortex, past its edges too.
  hush: beyond([0.34, 0.4], [0.5, 0.4], `${mix(INK, 0)} 0%, ${HUSHED} 70%`),
  // The fire spreading along the window's edges, then flickering there.
  blaze: `inset 0 0 220px 40px ${mix(FIRE.blaze, 50)}`,
  blazeFlicker: `inset 0 0 120px 10px ${mix(FIRE.gold, 35)}`,
  // Rays of fire around the crown: fine ones, close together, and paler ones, far apart.
  fineRays: `repeating-conic-gradient(from 0deg, ${mix(METAL.mid, 0)} 0deg 5deg, ${mix(FIRE.gold, 26)} 7.5deg, ${mix(METAL.mid, 0)} 10deg 15deg)`,
  broadRays: `repeating-conic-gradient(from 6deg, ${mix(METAL.mid, 0)} 0deg 14deg, ${mix(FIRE.white, 16)} 16deg, ${mix(METAL.mid, 0)} 18deg 30deg)`,
  // The fire's halo right around the crown.
  halo: `radial-gradient(circle, ${mix(FIRE.gold, 50)}, ${mix(FIRE.red, 22)} 45%, ${mix(FIRE.red, 0)} 70%)`,
  // The heart of the vortex: white-hot at its core, then gold, glowing red.
  core: `radial-gradient(circle, ${FIRE.white} 25%, ${FIRE.gold} 50%, ${mix(FIRE.red, 0)} 72%)`,
  coreGlow: `0 0 50px 16px ${mix(FIRE.red, 60)}`,
  // The glow of an ember, a spark or a swirling mote, `blur` px wide, spread by `spread` px.
  glow: (blur: number, spread = 0) => `0 0 ${blur}px ${spread}px ${FIRE.red}`,
  // The rings of the Tier-up, in the metal and the fire.
  ring: mix(METAL.light, 70),
  floorWide: mix(METAL.mid, 60),
  gust: mix(METAL.mid, 16),
  gustWide: mix(FIRE.gold, 55),
  // The letters of the name, white-hot at the top down to charred, glowing red.
  letters: `linear-gradient(180deg, ${FIRE.white} 0%, ${FIRE.gold} 38%, ${METAL.mid} 60%, ${FIRE.char} 100%)`,
  nameGlow: `drop-shadow(0 0 28px ${mix(FIRE.red, 70)})`,
  // The old Emblem heating up, from its own colours to white-hot.
  cold: "sepia(0) saturate(1) hue-rotate(0deg) brightness(1)",
  hot: "sepia(1) saturate(4) hue-rotate(-28deg) brightness(1.4)",
} as const;
