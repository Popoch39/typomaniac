import type { Rank } from "ranked";

import { RankedPlaceBody } from "@/components/ranked/ranked-place-body";
import { rankedPlaceOf } from "@/components/ranked/ranked-place-of";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// « Ta place » on the Ranked page: the reader's rank in large, its TP and how far the next.
export const RankedPlace = ({ rank }: { rank: Rank | null }) => {
  const locale = useLocale();

  return (
    <section aria-labelledby="ranked-place-title" className="flex flex-col gap-3">
      <h2
        id="ranked-place-title"
        className="font-mono text-xs tracking-[0.06em] text-faint uppercase"
      >
        {m.ranked_place_title({}, { locale })}
      </h2>
      <RankedPlaceBody place={rankedPlaceOf(rank, locale)} />
    </section>
  );
};
