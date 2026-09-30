import type { Rank, Tier } from "ranked";

import { tpProgressOf } from "@/components/tier/rank/tp-progress-of";
import { TIER_NAMES } from "@/components/tier/tier";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// A rank in words on the rank card of a Profile's header: its Tier (for its Emblem and its colour,
// none in Placement), its name, its figure at the right of the name, and the line under its bar.
export type ProfileRankView = {
  tier: Tier | null;
  name: string;
  figure: string;
  line: string | null;
};

// « Gold II », « 42/100 TP », « 58 TP avant Gold I »; « Maniac » and its TP; « Placement » and
// « 2 / 5 Duels ». Null without a Rating.
export const profileRankView = (rank: Rank | null, locale: Locale): ProfileRankView | null => {
  const progress = tpProgressOf(rank, locale);
  const numbers = numberFormat(locale);

  if (progress === null) {
    return null;
  }

  switch (progress.kind) {
    case "division": {
      return {
        tier: progress.tier,
        name: progress.name,
        figure: m.profile_rank_tp_of(
          { tp: numbers.format(progress.tp), of: numbers.format(progress.of) },
          { locale },
        ),
        line: progress.toNext,
      };
    }

    case "maniac": {
      return {
        tier: "maniac",
        name: TIER_NAMES.maniac,
        figure: m.rank_tp({ tp: numbers.format(progress.tp) }, { locale }),
        line: null,
      };
    }

    case "placement": {
      return {
        tier: null,
        name: m.ranked_place_placement({}, { locale }),
        figure: m.ranked_place_placement_played(
          { played: numbers.format(progress.played), of: numbers.format(progress.of) },
          { locale },
        ),
        line: null,
      };
    }
  }
};
