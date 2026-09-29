import type { Rank } from "ranked";

import { type TpProgress, tpProgressOf } from "@/components/tier/rank/tp-progress-of";

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

// The reader's place from their rank, by the same progress as the User card's bar.
export const rankedPlaceOf = (rank: Rank | null): RankedPlaceView => {
  const progress = tpProgressOf(rank);

  if (progress === null) {
    return { kind: "unranked" };
  }

  if (progress.kind !== "division") {
    return progress;
  }

  return { ...progress, ahead: `${progress.of - progress.tp} avant ${progress.next}` };
};
