export const TIERS = ["bronze", "silver", "gold", "platinum", "diamond", "maniac"] as const;

export type Tier = (typeof TIERS)[number];

export type Division = 1 | 2 | 3;

export const TIER_NAMES: Record<Tier, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  platinum: "Platine",
  diamond: "Diamant",
  maniac: "Maniaque",
};

// Each tier's colour token, so the badge reads without it too (the emblem differs).
export const TIER_COLORS: Record<Tier, string> = {
  bronze: "text-tier-bronze",
  silver: "text-tier-silver",
  gold: "text-tier-gold",
  platinum: "text-tier-platinum",
  diamond: "text-tier-diamond",
  maniac: "text-tier-maniac",
};
