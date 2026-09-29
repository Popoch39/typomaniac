import type { Rank } from "ranked";

import { RankedTierRow } from "@/components/ranked/ranked-tier-row";
import { TIER_COUNTS, tierRows } from "@/components/ranked/tier-rows";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// "7 Tiers · 24 Divisions · 1 sommet", read from the ranked package.
const countsOf = (locale: Locale) => {
  const numbers = numberFormat(locale);

  return m.ranked_tier_counts(
    {
      tiers: numbers.format(TIER_COUNTS.tiers),
      divisions: numbers.format(TIER_COUNTS.divisions),
      summits: numbers.format(TIER_COUNTS.summits),
      summitCount: TIER_COUNTS.summits,
    },
    { locale },
  );
};

// The Ranked page's Tiers from Maniac down to Iron, on the whole height of the page, the reader's
// marked and the Divisions they have climbed lit.
export const RankedTiers = ({ rank }: { rank: Rank | null }) => {
  const locale = useLocale();

  return (
    <section aria-labelledby="ranked-title" className="flex min-w-0 flex-1 flex-col">
      <div className="flex justify-between pb-5 font-mono text-xs tracking-[0.06em] text-faint uppercase tabular-nums">
        <h1 id="ranked-title">{m.ranked_title({}, { locale })}</h1>
        <span>{countsOf(locale)}</span>
      </div>
      <ol aria-label={m.ranked_tiers_label({}, { locale })} className="flex flex-1 flex-col">
        {tierRows(rank).map((row) => (
          <RankedTierRow key={row.tier} row={row} />
        ))}
      </ol>
    </section>
  );
};
