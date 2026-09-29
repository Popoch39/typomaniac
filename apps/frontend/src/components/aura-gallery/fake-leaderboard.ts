import { DIVISION_TP, type Standing, type Tier } from "ranked";

import type { LeaderboardEntry } from "@/api/leaderboard";

// How many of the hundred fake Users stand in each Tier, from the top: most from Gold up, where
// the Ornaments move and cost the most.
const TIER_COUNTS: readonly (readonly [Tier, number])[] = [
  ["maniac", 12],
  ["diamond", 22],
  ["platinum", 22],
  ["gold", 22],
  ["silver", 8],
  ["bronze", 7],
  ["iron", 7],
];

// The first User's TP, one less at each place down: the list reads in order.
const TOP_TP = 300;

// Any Division will do: the Ornament depends on the Tier only.
const standingIn = (tier: Tier, tp: number): Standing =>
  tier === "maniac"
    ? { tier, tp, shielded: false }
    : { tier, division: 2, tp: tp % DIVISION_TP, shielded: false };

// A hundred fake Users of the Classement, by Tier from Maniac down, each wearing their Tier's
// Ornament but every seventh, who wears none.
export const fakeLeaderboard = (): LeaderboardEntry[] =>
  TIER_COUNTS.flatMap(([tier, count]) => Array.from({ length: count }, () => tier)).map(
    (tier, index) => {
      const position = index + 1;

      return {
        position,
        handle: `joueur_${String(position).padStart(3, "0")}`,
        image: null,
        ornament: position % 7 === 0 ? null : tier,
        rank: standingIn(tier, TOP_TP - position),
      };
    },
  );
