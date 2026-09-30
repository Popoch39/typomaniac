import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { meQueryOptions } from "@/api/me";
import { OwnProfileEmpty } from "@/components/profile/own-profile-empty";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileStatsSkeleton } from "@/components/profile/profile-stats-skeleton";

// The Profil page, the signed-in User's own (`/profile`), the Vitrine: their header, with their
// settings behind « Modifier le profil », then their Stats.
export const ProfilePage = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  // The route sends a Visitor away; signing out here leaves an empty page until they leave.
  if (me === null) {
    return null;
  }

  return (
    // The whole window's height: the Stats' bento takes what the header leaves.
    <div className="flex flex-1 flex-col gap-5">
      <ProfileHero me={me} />
      {/* No Duel without a Handle, so no Stats. A new Handle reads the Stats again: the header
          and the settings stay while they load. */}
      {me.handle === null ? null : (
        <Suspense fallback={<ProfileStatsSkeleton />}>
          <ProfileStats handle={me.handle} empty={<OwnProfileEmpty />} />
        </Suspense>
      )}
    </div>
  );
};
