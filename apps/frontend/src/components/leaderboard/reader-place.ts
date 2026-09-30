import { isPlacement, type Rank, type Standing } from "ranked";

import type { LeaderboardEntry } from "@/api/leaderboard";

// Where the reader stands in the Leaderboard: their Place, and their rank.
export type ReaderPlace = { place: number; standing: Standing };

// The reader's Place once they are in the Leaderboard (its line, null before): the Place from the
// Leaderboard, the rank from `/me`, as on their User card, the Leaderboard's line until `/me` has
// it.
export const readerPlace = (
  line: LeaderboardEntry | null,
  rank: Rank | null,
): ReaderPlace | null =>
  line === null
    ? null
    : {
        place: line.place,
        standing: rank !== null && !isPlacement(rank) ? rank : line.rank,
      };
