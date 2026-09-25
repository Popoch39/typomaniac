import type { Rank } from "ranked";

import { standingName } from "@/components/tier/tier";

// A rank in words, never the MMR: "Or II · 42 TP", "Maître · 250 TP", or the Placement Duels left.
export const rankLabel = (rank: Rank) => {
  if ("placementsLeft" in rank) {
    return rank.placementsLeft === 1
      ? "Placement · 1 Duel restant"
      : `Placement · ${rank.placementsLeft} Duels restants`;
  }

  return `${standingName(rank)} · ${rank.tp} TP`;
};
