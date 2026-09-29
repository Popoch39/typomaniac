import {
  DIVISION_TP,
  isPlacement,
  nextStanding,
  PLACEMENT_DUELS,
  type Rank,
  type Standing,
} from "ranked";

import { standingName } from "@/components/tier/tier";

// Where a rank stands on its way up: the TP of its Division out of 100, the Placement Duels played
// out of 5, or Maniac's TP alone, which has no ceiling.
export type TpProgress =
  | {
      kind: "division";
      tp: number;
      of: typeof DIVISION_TP;
      tier: Standing["tier"];
      // The rank itself: "Or II".
      name: string;
      // The rank above: "Or I".
      next: string;
      // "58 TP avant Or I".
      toNext: string;
    }
  | { kind: "placement"; played: number; of: typeof PLACEMENT_DUELS }
  | { kind: "maniac"; tp: number };

// A rank's progress, null without a Rating.
export const tpProgressOf = (rank: Rank | null): TpProgress | null => {
  if (rank === null) {
    return null;
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

  const nextName = standingName(next);

  return {
    kind: "division",
    tp: rank.tp,
    of: DIVISION_TP,
    tier: rank.tier,
    name: standingName(rank),
    next: nextName,
    toNext: `${DIVISION_TP - rank.tp} TP avant ${nextName}`,
  };
};
