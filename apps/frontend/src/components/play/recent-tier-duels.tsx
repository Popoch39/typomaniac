import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";

import { recentRankedDuelsQueryOptions } from "@/api/recent-ranked-duels";
import { PlayCardRows } from "@/components/play/play-card-rows";
import { RecentTierDuelRow } from "@/components/play/recent-tier-duel-row";
import { TIER_NAMES } from "@/components/tier/tier";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// « Derniers Duels en Gold »: the last Ranked Duels won in the User's Tier, « Derniers Duels » of
// every Tier in Placement, each dated from when Jouer showed. Read again each time Jouer shows,
// never making the card wait: nothing until read, nor without a Duel.
export const RecentTierDuels = () => {
  const locale = useLocale();
  const { data } = useQuery(recentRankedDuelsQueryOptions);
  const [now] = useState(() => Date.now());
  const titleId = useId();

  if (data === undefined || data.duels.length === 0) {
    return null;
  }

  const title =
    data.tier === null
      ? m.play_ranked_recent_duels({}, { locale })
      : m.play_ranked_recent_duels_tier({ tier: TIER_NAMES[data.tier] }, { locale });

  return (
    <section aria-labelledby={titleId} className="flex min-h-0 flex-1 flex-col gap-2">
      <h3
        id={titleId}
        className="shrink-0 text-xs leading-5 font-bold tracking-wide uppercase opacity-80"
      >
        {title}
      </h3>
      <PlayCardRows label={title}>
        {data.duels.map((duel) => (
          <RecentTierDuelRow key={duel.id} duel={duel} now={now} />
        ))}
      </PlayCardRows>
    </section>
  );
};
