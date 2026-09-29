import { isPlacement, type Rank, type Standing } from "ranked";

import type { LeaderboardEntry } from "@/api/leaderboard";

// Where the reader stands in the Classement: their place, and their rank.
export type ReaderPlace = { position: number; standing: Standing };

// The reader's place once they are in the Classement (its line, null before): the place from the
// Classement, the rank from `/me`, as on their User card, the Classement's line until `/me` has it.
export const readerPlace = (
  line: LeaderboardEntry | null,
  rank: Rank | null,
): ReaderPlace | null =>
  line === null
    ? null
    : {
        position: line.position,
        standing: rank !== null && !isPlacement(rank) ? rank : line.rank,
      };
