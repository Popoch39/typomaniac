import type { Rank } from "ranked";

import { RankedPlaceBody } from "@/components/ranked/ranked-place-body";
import { rankedPlaceOf } from "@/components/ranked/ranked-place-of";

// « Ta place » on the Ranked page: the reader's rank in large, its TP and how far the next.
export const RankedPlace = ({ rank }: { rank: Rank | null }) => (
  <section aria-labelledby="ranked-place-title" className="flex flex-col gap-3">
    <h2
      id="ranked-place-title"
      className="font-mono text-xs tracking-[0.06em] text-faint uppercase"
    >
      Ta place
    </h2>
    <RankedPlaceBody place={rankedPlaceOf(rank)} />
  </section>
);
