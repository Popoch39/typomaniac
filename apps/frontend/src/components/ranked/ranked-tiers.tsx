import type { Rank } from "ranked";

import { RankedTierRow } from "@/components/ranked/ranked-tier-row";
import { TIER_COUNTS, tierRows } from "@/components/ranked/tier-rows";

// "7 Tiers · 24 Divisions · 1 sommet", read from the ranked package.
const COUNTS = `${TIER_COUNTS.tiers} Tiers · ${TIER_COUNTS.divisions} Divisions · ${TIER_COUNTS.summits} sommet`;

// The Ranked page's Tiers from Maniac down to Fer, on the whole height of the page, the reader's
// marked and the Divisions they have climbed lit.
export const RankedTiers = ({ rank }: { rank: Rank | null }) => (
  <section aria-labelledby="ranked-title" className="flex min-w-0 flex-1 flex-col">
    <div className="flex justify-between pb-5 font-mono text-xs tracking-[0.06em] text-faint uppercase tabular-nums">
      <h1 id="ranked-title">Ranked</h1>
      <span>{COUNTS}</span>
    </div>
    <ol aria-label="Tiers" className="flex flex-1 flex-col">
      {tierRows(rank).map((row) => (
        <RankedTierRow key={row.tier} row={row} />
      ))}
    </ol>
  </section>
);
