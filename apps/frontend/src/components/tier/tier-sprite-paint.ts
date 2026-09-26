import type { Tier } from "ranked";

// The paint of the Tier sprite, from the « Paliers de rang » mock-up (`A2 · Blason revu`): its
// classes become attribute sets, so the symbols need no stylesheet. Every id is prefixed `tier-`.

export const emblemId = (tier: Tier) => `tier-emblem-${tier}`;

export const ornamentId = (tier: Tier) => `tier-ornament-${tier}`;

// A reference to one part of the sprite, for `href`.
export const ref = (id: string) => `#${id}`;

// A gradient of the sprite, for `fill` or `stroke`.
export const paint = (id: string) => `url(#${id})`;

// The polished metal of a Tier: light at the top, a dark crease in the middle, a sheen below.
export const metalId = (tier: Tier) => `tier-metal-${tier}`;

// The darker metal of the pieces behind (laurels, feathers, banner tails).
export const deepId = (tier: Tier) => `tier-deep-${tier}`;

export const glowId = (tier: Tier) => `tier-glow-${tier}`;

// The fire of the Maniac: flames, embers and the gems of its crown.
export const HOT_ID = "tier-hot";

export const LEAF_ID = "tier-leaf";

export const FEATHER_ID = "tier-feather";

export const FLAME_ID = "tier-flame";

export const STAR_ID = "tier-star";

export const SPARK_ID = "tier-spark";

// The flame over the Maniac's crown, and its bright core, on the 32 × 32 grid of an Emblem.
export const CROWN_FLAME =
  "M16 1.5 C19.5 5 21 8.5 19.5 11.5 C18.6 13.3 17.3 14.3 16 15 C14.7 14.3 13.4 13.3 12.5 11.5 C11 8.5 12.5 5 16 1.5 Z";

export const CROWN_FLAME_CORE =
  "M16 6.5 C17.6 8.5 18 10.2 17.2 11.8 C16.8 12.6 16.4 13 16 13.3 C15.6 13 15.2 12.6 14.8 11.8 C14 10.2 14.4 8.5 16 6.5 Z";

export const INK = "#15141c";

// The Maniac is drawn from the brand colour, #ff8a65, mixed with white (light) and with the ink
// (crease, then outline), as the mock-up does. Fixed: the sprite does not follow a change of accent.
const MANIAC = { light: "#ffc5b2", mid: "#ff8a65", crease: "#ad614b", outline: "#673d36" };

// Stops at 0, 0.44, 0.5, 0.72 and 1: light, mid, crease, sheen, crease.
export const METALS: Record<Tier, { light: string; mid: string; crease: string; sheen: string }> = {
  fer: { light: "#e2e4ea", mid: "#8b8e9c", crease: "#4f525d", sheen: "#8b8e9c" },
  bronze: { light: "#f7d0ad", mid: "#c48154", crease: "#7a4526", sheen: "#c48154" },
  argent: { light: "#ffffff", mid: "#c0c3cc", crease: "#7c808c", sheen: "#d4d6dd" },
  or: { light: "#fff4c4", mid: "#f2c14e", crease: "#a8781a", sheen: "#f5cd6a" },
  platine: { light: "#e0fbf6", mid: "#6fd1c0", crease: "#2f8a7c", sheen: "#8fe0d2" },
  diamant: { light: "#f3f6ff", mid: "#9db4ff", crease: "#5068c8", sheen: "#b9c9ff" },
  maniac: { light: MANIAC.light, mid: MANIAC.mid, crease: MANIAC.crease, sheen: MANIAC.mid },
};

// The outline of each Tier's metal, behind its rim and its bands.
export const OUTLINES: Record<Tier, string> = {
  fer: "#2e3038",
  bronze: "#43240f",
  argent: "#454852",
  or: "#5c3f06",
  platine: "#134a42",
  diamant: "#25337a",
  maniac: MANIAC.outline,
};

// The Tiers whose Ornament has pieces behind, in deep metal: from the top of that gradient to
// the outline.
export const DEEPS: readonly { tier: Tier; top: string }[] = [
  { tier: "argent", top: "#7c808c" },
  { tier: "or", top: "#a8781a" },
  { tier: "platine", top: "#2f8a7c" },
  { tier: "diamant", top: "#7890e8" },
  { tier: "maniac", top: MANIAC.mid },
];

// The Tiers that glow: their colour and its opacity at each stop, from the centre out.
export const GLOWS: readonly { tier: Tier; color: string; stops: [number, number][] }[] = [
  { tier: "or", color: "#f2c14e", stops: [[0, 0.32]] },
  { tier: "platine", color: "#6fd1c0", stops: [[0, 0.38]] },
  { tier: "diamant", color: "#9db4ff", stops: [[0, 0.45]] },
  {
    tier: "maniac",
    color: MANIAC.mid,
    stops: [
      [0, 0.6],
      [0.6, 0.18],
    ],
  },
];

export const HOT = { light: "#fff6d6", mid: "#ffd166", deep: MANIAC.mid };

const ROUND = { strokeLinejoin: "round", strokeLinecap: "round" } as const;

// The outline under a piece of metal: its own shape, stroked a little wider.
export const RIM = { strokeWidth: 2.4, strokeLinejoin: "round" } as const;

// The lit half of a piece.
export const LIGHT = { fill: "#fff", opacity: 0.14 };

export const BRIGHT = { fill: "#fff", opacity: 0.35 };

export const BEVEL = {
  fill: "none",
  stroke: "#fff",
  strokeOpacity: 0.45,
  strokeWidth: 0.6,
  strokeLinejoin: "round",
} as const;

export const BANNER_BEVEL = {
  fill: "none",
  stroke: "#fff",
  strokeOpacity: 0.5,
  strokeWidth: 1,
  strokeLinecap: "round",
} as const;

// The facets of the Diamant.
export const FACETS = {
  fill: "none",
  stroke: INK,
  strokeOpacity: 0.4,
  strokeWidth: 0.6,
  strokeLinejoin: "round",
} as const;

// The ink line around a leaf, a feather or a stud of metal.
export const LINE = {
  stroke: INK,
  strokeOpacity: 0.4,
  strokeWidth: 1,
  strokeLinejoin: "round",
} as const;

// An engraving cut in the metal, and the light on its lower lip.
export const ENGRAVED = { fill: INK, opacity: 0.58 };

export const ENGRAVED_LIGHT = { fill: "#fff", opacity: 0.38 };

export const ENGRAVED_LINE = {
  fill: "none",
  stroke: INK,
  strokeOpacity: 0.6,
  strokeWidth: 2.8,
  ...ROUND,
} as const;

export const ENGRAVED_LINE_LIGHT = {
  fill: "none",
  stroke: "#fff",
  strokeOpacity: 0.35,
  strokeWidth: 2.8,
  ...ROUND,
} as const;

export const STUD = {
  fill: "#fff",
  fillOpacity: 0.9,
  stroke: INK,
  strokeOpacity: 0.45,
  strokeWidth: 0.4,
};

export const GLINT = { fill: "#fff" };

// The ring of an Ornament: its outline, then its metal.
export const BAND_OUTLINE = { fill: "none", strokeWidth: 6.5 };

export const BAND = { fill: "none", strokeWidth: 3.6 };

export const BEADS = {
  fill: "none",
  stroke: "#fff",
  strokeOpacity: 0.4,
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeDasharray: "0.1 5.2",
} as const;

export const STEM = { fill: "none", strokeWidth: 2.4, strokeLinecap: "round" } as const;

export const STAR_EDGE = { fill: "none", strokeWidth: 1.8, strokeLinejoin: "round" } as const;

export const RAYS = { fill: "none", strokeWidth: 36, strokeDasharray: "2.4 8.07", opacity: 0.3 };

// A plate behind the Platine and Diamant Ornaments, in their outline colour.
export const PLATES = {
  platine: { fill: OUTLINES.platine, fillOpacity: 0.7 },
  diamant: { fill: OUTLINES.diamant, fillOpacity: 0.8 },
};
