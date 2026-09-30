import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { profileQueryOptions } from "@/api/profile";
import { AccuracyCard } from "@/components/profile/accuracy-card";
import { ProfileRecords } from "@/components/profile/profile-records";
import { WinRateCard } from "@/components/profile/win-rate-card";
import { WpmCard } from "@/components/profile/wpm-card";

// The Stats of the User who holds `handle`, the Vitrine: their average wpm and its curve on the
// widest card, their win rate and their average accuracy beside it, their Records under both. Or
// `empty` before their first Duel (an invitation to play on one's own Profile, a plain fact on
// another's).
export const ProfileStats = ({ handle, empty }: { handle: string; empty: ReactNode }) => {
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle));
  const { stats } = profile;

  if (stats.duels === 0) {
    return empty;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-[minmax(0,1fr)_22.5rem] gap-5">
        <WpmCard handle={handle} average={stats.averages.wpm} record={stats.records.wpm} />
        <div className="flex flex-col gap-5">
          <WinRateCard record={stats.record} duels={stats.duels} />
          <AccuracyCard accuracy={stats.averages.accuracy} />
        </div>
      </div>
      <ProfileRecords records={stats.records} />
    </div>
  );
};
