import { DIVISIONS, type Standing, type Tier, TIERS } from "ranked";

// Where a Tier stands for the reader: climbed past, theirs, still ahead; or open to anyone without
// a standing (in Placement, without a Rating, or a Visitor).
export type LadderReach = "climbed" | "mine" | "ahead" | "open";

export type LadderRow = {
  tier: Tier;
  // The Tier's step on the ladder, from "01" for Fer to "07" for Maniac.
  number: string;
  reach: LadderReach;
  // The Tier's marks: one per Division, the one summit of Maniac.
  divisions: number;
  // Those the reader has climbed.
  lit: number;
};

const divisionsOf = (tier: Tier) => (tier === "maniac" ? 1 : DIVISIONS.length);

// The Divisions of their own Tier the reader has reached: one for IV, four for I, Maniac's one.
const litOf = (standing: Standing) => (standing.tier === "maniac" ? 1 : 5 - standing.division);

const reachOf = (index: number, mine: number): LadderReach => {
  if (mine < 0) {
    return "open";
  }

  if (index < mine) {
    return "climbed";
  }

  return index === mine ? "mine" : "ahead";
};

const rowOf = (tier: Tier, index: number, standing: Standing | null): LadderRow => {
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

// The Tiers from Maniac at the top down to Fer, each with how far the reader has climbed it.
export const tierLadder = (standing: Standing | null): LadderRow[] =>
  TIERS.map((tier, index) => rowOf(tier, index, standing)).toReversed();

// The ladder in figures: its Tiers, the Divisions under Maniac, and Maniac, the one summit.
export const LADDER_COUNTS = {
  tiers: TIERS.length,
  divisions: (TIERS.length - 1) * DIVISIONS.length,
  summits: 1,
};
