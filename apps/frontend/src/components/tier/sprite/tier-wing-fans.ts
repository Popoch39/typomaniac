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
