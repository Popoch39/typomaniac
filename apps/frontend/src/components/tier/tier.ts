import type { Division, Standing, Tier } from "ranked";

export const TIER_NAMES: Record<Tier, string> = {
  fer: "Fer",
  bronze: "Bronze",
  argent: "Argent",
  or: "Or",
  platine: "Platine",
  diamant: "Diamant",
  maniac: "Maniac",
};

// Each Tier's colour token, so the badge reads without it too (the emblem differs).
export const TIER_COLORS: Record<Tier, string> = {
  fer: "text-tier-iron",
  bronze: "text-tier-bronze",
  argent: "text-tier-silver",
  or: "text-tier-gold",
  platine: "text-tier-platinum",
  diamant: "text-tier-diamond",
  maniac: "text-tier-maniac",
};

export const DIVISION_NUMERALS: Record<Division, string> = { 4: "IV", 3: "III", 2: "II", 1: "I" };

// "Or IV", or "Maniac", without Division.
export const standingName = (standing: Standing) =>
  standing.tier === "maniac"
    ? TIER_NAMES.maniac
    : `${TIER_NAMES[standing.tier]} ${DIVISION_NUMERALS[standing.division]}`;
