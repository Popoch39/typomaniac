import { changesTier, type Rank, type Standing, stepOf } from "ranked";

import type { DuelEnding } from "@/stores/duel-store";

export type DuelRanked = NonNullable<DuelEnding["ranked"]>;

// What the end of a ranked Duel shows: the Placements left, the rank revealed by the last one, or
// the TP moved, within the Division or across one (`newTier`: into another Tier).
export type RankChange =
  | { kind: "placement"; placementsLeft: number }
  | { kind: "revealed"; standing: Standing }
  | {
      kind: "moved" | "promoted" | "demoted";
      tp: number;
      from: Standing;
      standing: Standing;
      newTier: boolean;
    };

const isStanding = (rank: Rank): rank is Standing => "tier" in rank;

export const rankChange = ({ tp, previousRank, rank }: DuelRanked): RankChange => {
  if (!isStanding(rank)) {
    return { kind: "placement", placementsLeft: rank.placementsLeft };
  }

  if (!isStanding(previousRank) || tp === null) {
    return { kind: "revealed", standing: rank };
  }

  const gap = stepOf(rank) - stepOf(previousRank);
  const newTier = changesTier(previousRank, rank);

  if (gap === 0) {
    return { kind: "moved", tp, from: previousRank, standing: rank, newTier };
  }

  return {
    kind: gap > 0 ? "promoted" : "demoted",
    tp,
    from: previousRank,
    standing: rank,
    newTier,
  };
};

// The rank a Duel moved up into, when it reached another Tier or Maître: celebrated on the end
// screen. Null for a move up a Division, a demotion, TP within the Division, and a Placement,
// last one included (the rank revealed was never held before).
export const tierReached = (change: RankChange) =>
  change.kind === "promoted" && change.newTier ? change.standing : null;
