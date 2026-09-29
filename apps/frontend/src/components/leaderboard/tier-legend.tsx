import { type Tier, TIERS } from "ranked";

import { LeaderboardAsideCard } from "@/components/leaderboard/leaderboard-aside-card";
import { TierLegendRow } from "@/components/leaderboard/tier-legend-row";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Tiers from the highest down.
const LEGEND_TIERS = TIERS.toReversed();

// The Tiers of the Classement, from Maniac to Iron, the reader's marked (none until they are in it).
export const TierLegend = ({ tier }: { tier: Tier | null }) => {
  const locale = useLocale();

  return (
    <LeaderboardAsideCard
      title={m.leaderboard_tiers_title({}, { locale })}
      className="gap-1 px-3.5 pt-5 pb-3.5"
    >
      <ul className="flex flex-col">
        {LEGEND_TIERS.map((legendTier) => (
          <TierLegendRow key={legendTier} tier={legendTier} mine={legendTier === tier} />
        ))}
      </ul>
    </LeaderboardAsideCard>
  );
};
