import type { Tier } from "ranked";

// The shapes of the Emblems, on their 32 × 32 grid, and where each Tier's is placed on the 120 ×
// 120 grid of the sprite: the symbols draw them, and the Tier-up traces their outline.

export const SHIELD = "M16 2 L28 6 V15 C28 23 22 28 16 30 C10 28 4 23 4 15 V6 Z";

export const HEXAGON = "M16 2 L28 9 V23 L16 30 L4 23 V9 Z";

export const GEM = "M9 4 H23 L30 12 L16 30 L2 12 Z";

// The lines the Diamond's gem is cut along, and traced as it comes in.
export const GEM_FACETS = "M2 12 H30 M9 4 L12 12 L16 30 L20 12 L23 4 M12 12 L16 4 L20 12";

export const CROWN = "M3 11 L10 17.5 L13 12.5 L16 16 L19 12.5 L22 17.5 L29 11 L26 25 H6 Z";

export const CROWN_BAND = "M6 26.5 H26 V29.5 H6 Z";

// The star cut in the Gold and the Platinum, and traced as the Gold comes in.
export const STAR =
  "M16 8 L18.2 13.4 L24 13.6 L19.5 17.2 L21 22.8 L16 19.6 L11 22.8 L12.5 17.2 L8 13.6 L13.8 13.4 Z";

// Each Emblem's outline and its place on the 120 grid, bigger at each Tier.
export const EMBLEM_OUTLINES: Record<Tier, { d: string; transform: string }> = {
  iron: { d: SHIELD, transform: "translate(36 34) scale(1.5)" },
  bronze: { d: SHIELD, transform: "translate(35.2 33.2) scale(1.55)" },
  silver: { d: SHIELD, transform: "translate(34.4 32.4) scale(1.6)" },
  gold: { d: SHIELD, transform: "translate(33.6 31.6) scale(1.65)" },
  platinum: { d: HEXAGON, transform: "translate(32.5 30.5) scale(1.72)" },
  diamond: { d: GEM, transform: "translate(31.5 29.5) scale(1.78)" },
  maniac: { d: `${CROWN} ${CROWN_BAND}`, transform: "translate(30.4 28.4) scale(1.85)" },
};
