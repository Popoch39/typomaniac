import {
  DIVISION_TP,
  isPlacement,
  nextStanding,
  PLACEMENT_DUELS,
  type Rank,
  type Standing,
} from "ranked";

import { standingName } from "@/components/tier/tier";

// « Ta place » on the Ranked page: the reader's rank and how far the next, their Placement, or
// nothing yet.
export type RankedPlace =
  | {
      kind: "division";
      tier: Standing["tier"];
      // "Or II".
      name: string;
      tp: number;
      of: typeof DIVISION_TP;
      // "58 avant Or I".
      ahead: string;
    }
  | { kind: "maniac"; tp: number }
  | { kind: "placement"; played: number; of: typeof PLACEMENT_DUELS }
  | { kind: "unranked" };

// The reader's place from their rank, null without a Rating.
export const rankedPlaceOf = (rank: Rank | null): RankedPlace => {
  if (rank === null) {
    return { kind: "unranked" };
  }

  if (isPlacement(rank)) {
    return {
      kind: "placement",
      played: PLACEMENT_DUELS - rank.placementsLeft,
      of: PLACEMENT_DUELS,
    };
  }

  const next = nextStanding(rank);

  if (rank.tier === "maniac" || next === null) {
    return { kind: "maniac", tp: rank.tp };
  }

  return {
    kind: "division",
    tier: rank.tier,
    name: standingName(rank),
    tp: rank.tp,
    of: DIVISION_TP,
    ahead: `${DIVISION_TP - rank.tp} avant ${standingName(next)}`,
  };
};
