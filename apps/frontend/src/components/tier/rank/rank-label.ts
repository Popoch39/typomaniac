import type { Rank } from "ranked";

import { standingName } from "@/components/tier/tier";

// The TP a ranked Duel moved, signed: "+18 TP", "−15 TP".
export const signedTp = (tp: number) => `${tp >= 0 ? "+" : "−"}${Math.abs(tp)} TP`;

// A rank in words, never the MMR: "Or II · 42 TP", "Maniac · 250 TP", or the Placement Duels left.
export const rankLabel = (rank: Rank) => {
  if ("placementsLeft" in rank) {
    return rank.placementsLeft === 1
      ? "Placement · 1 Duel restant"
      : `Placement · ${rank.placementsLeft} Duels restants`;
  }

  return `${standingName(rank)} · ${rank.tp} TP`;
};
