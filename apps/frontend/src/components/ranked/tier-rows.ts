import { DIVISIONS, isPlacement, type Rank, type Standing, type Tier, TIERS } from "ranked";

// Where a Tier stands for the reader: climbed past, theirs, still ahead; or open to anyone without
// a standing (in Placement, without a Rating, or a Visitor).
export type TierReach = "climbed" | "mine" | "ahead" | "open";

export type TierRow = {
  tier: Tier;
  // The Tier's step, from "01" for Iron to "07" for Maniac.
  number: string;
  reach: TierReach;
  // The Tier's marks: one per Division, the one summit of Maniac.
  divisions: number;
  // Those the reader has climbed.
  lit: number;
};

const divisionsOf = (tier: Tier) => (tier === "maniac" ? 1 : DIVISIONS.length);

// The Divisions of their own Tier the reader has reached: one for IV, four for I, Maniac's one.
const litOf = (standing: Standing) =>
  standing.tier === "maniac" ? 1 : DIVISIONS.length + 1 - standing.division;

const reachOf = (index: number, mine: number): TierReach => {
  if (mine < 0) {
    return "open";
  }

  if (index < mine) {
    return "climbed";
  }

  return index === mine ? "mine" : "ahead";
};

const rowOf = (tier: Tier, index: number, standing: Standing | null): TierRow => {
  const mine = standing === null ? -1 : TIERS.indexOf(standing.tier);
  const reach = reachOf(index, mine);
  const divisions = divisionsOf(tier);
  const lit = { climbed: divisions, mine: standing === null ? 0 : litOf(standing), ahead: 0 };

  return {
    tier,
    number: String(index + 1).padStart(2, "0"),
    reach,
    divisions,
    lit: reach === "open" ? 0 : lit[reach],
  };
};

// The Tiers from Maniac at the top down to Iron, each with how far the reader has climbed it. In
// Placement or without a Rating, the reader has no Tier yet.
export const tierRows = (rank: Rank | null): TierRow[] => {
  const standing = rank === null || isPlacement(rank) ? null : rank;

  return TIERS.map((tier, index) => rowOf(tier, index, standing)).toReversed();
};

// The Tiers in figures: how many, the Divisions under Maniac, and Maniac, the one Tier without any.
export const TIER_COUNTS = {
  tiers: TIERS.length,
  divisions: (TIERS.length - 1) * DIVISIONS.length,
  summits: 1,
};
