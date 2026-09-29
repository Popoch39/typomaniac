import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { profileQueryOptions } from "@/api/profile";
import { ProfileProgression } from "@/components/profile/profile-progression";
import { StatsTiles } from "@/components/profile/stats-tiles";
import { SMALL_TITLE_PAINT } from "@/components/small-title-paint";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Stats of the User who holds `handle`: their tiles, then their Progression on its card, or
// `empty` before their first Duel (an invitation to play on one's own Profile, a plain fact on
// another's).
export const ProfileStats = ({ handle, empty }: { handle: string; empty: ReactNode }) => {
  const locale = useLocale();
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle));
  const played = profile.stats.duels > 0;

  return (
    <>
      <section className="flex flex-col gap-2.5">
        <h2 className={SMALL_TITLE_PAINT}>{m.profile_stats_title({}, { locale })}</h2>
        {played ? <StatsTiles stats={profile.stats} /> : empty}
      </section>
      {played ? <ProfileProgression handle={handle} /> : null}
    </>
  );
};
