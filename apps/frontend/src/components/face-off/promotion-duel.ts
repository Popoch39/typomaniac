import { changesTier, type Rank, type Stake, type Standing } from "ranked";

// A Promotion Duel for this User: a win would move them to another Tier or into Maître. Its title
// heads the banner and the announcement; `from` is the rank held, `to` the rank a win reaches.
export type PromotionDuel = { title: string; from: Standing; to: Standing };

// This User's Duel as a Promotion Duel, from their rank and Stake: null for an ordinary Duel, a
// move up a Division only, a Challenge or Placement (no Stake).
export const promotionDuel = (rank: Rank | null, stake: Stake | null): PromotionDuel | null => {
  if (stake === null || rank === null || "placementsLeft" in rank) {
    return null;
  }

  const to = stake.win.standing;

  if (!changesTier(rank, to)) {
    return null;
  }

  return { title: to.tier === "maitre" ? "Duel pour Maître" : "Duel de promotion", from: rank, to };
};
