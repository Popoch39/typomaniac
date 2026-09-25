import { useSuspenseQuery } from "@tanstack/react-query";

import { profileQueryOptions } from "@/api/profile";
import { ProfileProgression } from "@/components/profile/profile-progression";
import { StatsRecord } from "@/components/profile/stats-record";
import { StatsTiles } from "@/components/profile/stats-tiles";

// The Stats of the User who holds `handle`: their tiles and their record, or an invitation to play
// before their first Duel.
export const ProfileStats = ({ handle }: { handle: string }) => {
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle));

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-bold">Stats</h2>
      {profile.stats.duels === 0 ? (
        <p className="text-muted-foreground">
          Pas encore de Duel : joue ton premier pour voir tes Stats.
        </p>
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
