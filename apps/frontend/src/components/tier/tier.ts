import type { Division, Standing, Tier } from "ranked";

// The same in every Locale.
export const TIER_NAMES: Record<Tier, string> = {
  iron: "Iron",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
  maniac: "Maniac",
};

// Each Tier's colour token, so the badge reads without it too (the emblem differs).
export const TIER_COLORS: Record<Tier, string> = {
  iron: "text-tier-iron",
  bronze: "text-tier-bronze",
  silver: "text-tier-silver",
  gold: "text-tier-gold",
  platinum: "text-tier-platinum",
  diamond: "text-tier-diamond",
  maniac: "text-tier-maniac",
};

export const DIVISION_NUMERALS: Record<Division, string> = { 4: "IV", 3: "III", 2: "II", 1: "I" };

// "Gold IV", or "Maniac", without Division.
export const standingName = (standing: Standing) =>
  standing.tier === "maniac"
    ? TIER_NAMES.maniac
    : `${TIER_NAMES[standing.tier]} ${DIVISION_NUMERALS[standing.division]}`;
