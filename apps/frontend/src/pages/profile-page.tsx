import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { meQueryOptions } from "@/api/me";
import { OwnProfileEmpty } from "@/components/profile/own-profile-empty";
import { ProfileColumns } from "@/components/profile/profile-columns";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileStatsSkeleton } from "@/components/profile/profile-stats-skeleton";

// The Profil page, the signed-in User's own (`/profile`): their hero, then their Stats, and at the
// right their settings (their Handle, changed at will, and their Ornament).
export const ProfilePage = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  // The route sends a Visitor away; signing out here leaves an empty page until they leave.
  if (me === null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <ProfileHero me={me} />
      <ProfileColumns
        stats={
          // No Duel without a Handle, so no Stats. A new Handle reads the Stats again: the
          // settings stay while they load.
          me.handle === null ? null : (
            <Suspense fallback={<ProfileStatsSkeleton />}>
              <ProfileStats handle={me.handle} empty={<OwnProfileEmpty />} />
            </Suspense>
          )
        }
        settings={<ProfileSettings me={me} />}
      />
    </div>
  );
};
