// The feathers of a wing, fanned from its root on the 120 grid of an Ornament: how far each turns
// (deg) and its size, from the lowest.
export type WingFan = readonly (readonly [turn: number, scale: number])[];

// Where the feathers of a wing are rooted, on the 120 grid.
export const WING_ROOT = { x: 46, y: 56 } as const;

// The Platine's wing: three feathers of its metal. The Tier-up unfurls them one by one.
export const PLATINE_FAN: WingFan = [
  [48, 0.85],
  [28, 1],
  [8, 0.9],
];

// The Diamant's wing: four feathers of its deeper metal behind, three of its metal in front, each
// from the lowest. The Tier-up unfurls them one by one.
export const DIAMANT_FANS = {
  deep: [
    [60, 0.8],
    [38, 1],
    [16, 1.1],
    [-6, 0.95],
  ],
  metal: [
    [45, 0.66],
    [22, 0.76],
    [0, 0.72],
  ],
} as const satisfies Record<string, WingFan>;

// The Maniac's wing: five feathers of its deeper metal behind, three of its fire in front, each
// from the lowest. The Tier-up spreads them one by one.
export const MANIAC_FANS = {
  deep: [
    [70, 0.75],
    [48, 0.95],
    [26, 1.12],
    [4, 1.1],
    [-18, 0.9],
  ],
  hot: [
    [50, 0.66],
    [27, 0.78],
    [4, 0.74],
  ],
} as const satisfies Record<string, WingFan>;

// The embers by the Maniac's wing, in its fire: a spark, then two dots (centre, radius). The
// Tier-up pops them in one by one.
export const MANIAC_WING_EMBERS = {
  spark: "translate(12 26) scale(0.5)",
  dots: [
    [22, 14, 1.5],
    [3, 70, 1.3],
  ],
} as const;

// The crystal over the Diamant's wing, turned about its heart, and its lit half. The Tier-up pops
// it in.
export const WING_CRYSTAL = {
  d: "M45 6 L49.5 17 L45 31 L40.5 17 Z",
  lit: "M45 6 L45 31 L40.5 17 Z",
  transform: "rotate(-18 45 19)",
} as const;
