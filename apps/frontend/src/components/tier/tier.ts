import type { Division, Standing, Tier } from "ranked";

export const TIER_NAMES: Record<Tier, string> = {
  fer: "Fer",
  bronze: "Bronze",
  argent: "Argent",
  or: "Or",
  platine: "Platine",
  diamant: "Diamant",
  maitre: "Maître",
};

// Each Tier's colour token, so the badge reads without it too (the emblem differs).
export const TIER_COLORS: Record<Tier, string> = {
  fer: "text-tier-iron",
  bronze: "text-tier-bronze",
  argent: "text-tier-silver",
  or: "text-tier-gold",
  platine: "text-tier-platinum",
  diamant: "text-tier-diamond",
  maitre: "text-tier-master",
};

export const DIVISION_NUMERALS: Record<Division, string> = { 4: "IV", 3: "III", 2: "II", 1: "I" };

// "Or IV", or "Maître", without Division.
export const standingName = (standing: Standing) =>
  standing.tier === "maitre"
    ? TIER_NAMES.maitre
    : `${TIER_NAMES[standing.tier]} ${DIVISION_NUMERALS[standing.division]}`;
