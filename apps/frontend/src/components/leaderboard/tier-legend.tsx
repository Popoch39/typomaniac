import { type Tier, TIERS } from "ranked";

import { LeaderboardAsideCard } from "@/components/leaderboard/leaderboard-aside-card";
import { TierLegendRow } from "@/components/leaderboard/tier-legend-row";

// The Tiers from the highest down.
const LEGEND_TIERS = TIERS.toReversed();

// The Tiers of the Classement, from Maniac to Fer, the reader's marked (none until they are in it).
export const TierLegend = ({ tier }: { tier: Tier | null }) => (
  <LeaderboardAsideCard title="Tiers" className="gap-1 px-3.5 pt-5 pb-3.5">
    <ul className="flex flex-col">
      {LEGEND_TIERS.map((legendTier) => (
        <TierLegendRow key={legendTier} tier={legendTier} mine={legendTier === tier} />
      ))}
    </ul>
  </LeaderboardAsideCard>
);
