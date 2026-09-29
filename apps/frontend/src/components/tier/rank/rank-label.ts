import type { Rank } from "ranked";

import { standingName } from "@/components/tier/tier";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// The TP a ranked Duel moved, signed: "+18 TP", "−15 TP".
export const signedTp = (tp: number) => `${tp >= 0 ? "+" : "−"}${Math.abs(tp)} TP`;

// A rank in words, in the Locale, never the MMR: "Gold II · 42 TP", "Maniac · 250 TP", or the
// Placement Duels left.
export const rankLabel = (rank: Rank, locale: Locale) => {
  const numbers = numberFormat(locale);

  if ("placementsLeft" in rank) {
    return m.rank_placement(
      { count: rank.placementsLeft, shown: numbers.format(rank.placementsLeft) },
      { locale },
    );
  }

  return m.rank_standing({ standing: standingName(rank), tp: numbers.format(rank.tp) }, { locale });
};
