// The two halves the old Emblem splits into, as the Bronze → Silver artboard cuts it: each
// clipped at its middle line (the clip leaving room for the rim), and where it falls to, turned
// outwards.
export const TIER_UP_HALVES = [
  { part: "half-left", clip: "[clip-path:inset(-20px_50%_-20px_-20px)]", x: -130, rotation: -16 },
  { part: "half-right", clip: "[clip-path:inset(-20px_-20px_-20px_50%)]", x: 130, rotation: 16 },
] as const;
