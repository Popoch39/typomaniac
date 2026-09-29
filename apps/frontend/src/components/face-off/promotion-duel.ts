import { changesTier, type Rank, type Stake, type Standing } from "ranked";

import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// A Promotion Duel for this User: a win would move them to another Tier or into Maniac. Its title,
// in the Locale, heads the banner and the announcement; `from` is the rank held, `to` the rank a
// win reaches.
export type PromotionDuel = { title: string; from: Standing; to: Standing };

// This User's Duel as a Promotion Duel, from their rank and Stake: null for an ordinary Duel, a
// move up a Division only, a Challenge or Placement (no Stake).
export const promotionDuel = (
  rank: Rank | null,
  stake: Stake | null,
  locale: Locale,
): PromotionDuel | null => {
  if (stake === null || rank === null || "placementsLeft" in rank) {
    return null;
  }

  const to = stake.win.standing;

  if (!changesTier(rank, to)) {
    return null;
  }

  const title =
    to.tier === "maniac"
      ? m.face_off_promotion_maniac({}, { locale })
      : m.face_off_promotion({}, { locale });

  return { title, from: rank, to };
};
