// The cracks of white heat that run through the old gem before it breaks, on the Emblem's 32 grid,
// as the Diamond → Maniac artboard draws them: down its middle, then across each side, each wide
// as `width`, running through it from `at` for `duration` (s).
export const MANIAC_CRACKS = [
  {
    d: "M16 5 L14.6 10.5 L17.2 14.8 L14.9 20.6 L16.6 26.5",
    width: 0.5,
    at: 1.2,
    duration: 0.5,
  },
  { d: "M4 11.5 L8.6 13.4 L8 17.2", width: 0.45, at: 1.45, duration: 0.35 },
  { d: "M27.5 10.5 L22.6 14.2 L24.2 18.4", width: 0.45, at: 1.6, duration: 0.35 },
] as const;
