import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { profileQueryOptions } from "@/api/profile";
import { ProfileProgression } from "@/components/profile/profile-progression";
import { StatsRecord } from "@/components/profile/stats-record";
import { StatsTiles } from "@/components/profile/stats-tiles";

// The Stats of the User who holds `handle`: their tiles and their record, or `empty` before their
// first Duel (an invitation to play on one's own Profile, a plain fact on another's).
export const ProfileStats = ({ handle, empty }: { handle: string; empty: ReactNode }) => {
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle));

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">Stats</h2>
      {profile.stats.duels === 0 ? (
        empty
      ) : (
        <>
          <StatsTiles stats={profile.stats} />
          <StatsRecord stats={profile.stats} />
          <ProfileProgression handle={handle} />
        </>
      )}
    </section>
  );
};
