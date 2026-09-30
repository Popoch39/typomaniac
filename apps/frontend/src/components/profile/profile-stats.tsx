import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { profileQueryOptions } from "@/api/profile";
import { AccuracyCard } from "@/components/profile/accuracy-card";
import { PROFILE_BENTO_PAINT } from "@/components/profile/profile-card-paint";
import { ProfileRecords } from "@/components/profile/profile-records";
import { WinRateCard } from "@/components/profile/win-rate-card";
import { WpmCard } from "@/components/profile/wpm-card";

// The Stats of the User who holds `handle`, the Vitrine as a bento on the rest of the window: their
// average wpm and its curve on the widest tile, over both rows; their win rate and their average
// accuracy side by side at the top right; their three Records under them. Or `empty` before their
// first Duel (an invitation to play on one's own Profile, a plain fact on another's).
export const ProfileStats = ({ handle, empty }: { handle: string; empty: ReactNode }) => {
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle));
  const { stats } = profile;

  if (stats.duels === 0) {
    return empty;
  }

  return (
    <div className={PROFILE_BENTO_PAINT}>
      <WpmCard handle={handle} average={stats.averages.wpm} record={stats.records.wpm} />
      <WinRateCard record={stats.record} duels={stats.duels} />
      <AccuracyCard accuracy={stats.averages.accuracy} />
      <ProfileRecords records={stats.records} />
    </div>
  );
};
