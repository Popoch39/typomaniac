import type { Rank } from "ranked";

import { standingName } from "@/components/tier/tier";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// The TP a ranked Duel moved, signed, in the Locale: "+18 TP", "−15 TP".
export const signedTp = (tp: number, locale: Locale) => {
  const shown = numberFormat(locale).format(Math.abs(tp));

  return tp >= 0
    ? m.rank_tp_gain({ tp: shown }, { locale })
    : m.rank_tp_loss({ tp: shown }, { locale });
};

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

  return m.rank_standing(
    { standing: standingName(rank, locale), tp: numbers.format(rank.tp) },
    { locale },
  );
};
