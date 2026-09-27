// The four shards the struck Emblem is made of, as the Bronze → Argent artboard cuts them: its
// quarters, split at the middle of its 32 grid across and at 15.5 down (on its 320 px box, each
// clip leaving room for the rim), and where each flies in from, turned and larger.
export const TIER_UP_SHARDS = [
  { clip: "inset(-40px 160px 165px -40px)", x: -560, y: -320, rotation: -50 },
  { clip: "inset(-40px -40px 165px 160px)", x: 560, y: -320, rotation: 50 },
  { clip: "inset(155px 160px -40px -40px)", x: -560, y: 340, rotation: 36 },
  { clip: "inset(155px -40px -40px 160px)", x: 560, y: 340, rotation: -36 },
] as const;
