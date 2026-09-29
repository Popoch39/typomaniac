import type { Rank } from "ranked";

import { type TpProgress, tpProgressOf } from "@/components/tier/rank/tp-progress-of";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

type DivisionProgress = Extract<TpProgress, { kind: "division" }>;

// What « Ta place » shows on the Ranked page: the progress of the reader's rank, a Division's with
// how far the next; or nothing yet.
export type RankedPlaceView =
  | (DivisionProgress & {
      // "58 avant Gold I".
      ahead: string;
    })
  | Exclude<TpProgress, DivisionProgress>
  | { kind: "unranked" };

// The reader's place from their rank, in the Locale, by the same progress as the User card's bar.
export const rankedPlaceOf = (rank: Rank | null, locale: Locale): RankedPlaceView => {
  const progress = tpProgressOf(rank, locale);

  if (progress === null) {
    return { kind: "unranked" };
  }

  if (progress.kind !== "division") {
    return progress;
  }

  const ahead = m.ranked_place_ahead(
    { tp: numberFormat(locale).format(progress.of - progress.tp), standing: progress.next },
    { locale },
  );

  return { ...progress, ahead };
};
