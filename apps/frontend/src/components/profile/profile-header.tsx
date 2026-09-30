import { useSuspenseQuery } from "@tanstack/react-query";
import { useId } from "react";

import { profileQueryOptions } from "@/api/profile";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileDuels } from "@/components/profile/profile-duels";
import { ProfileRankCard } from "@/components/profile/profile-rank-card";
import { ProfileTitle } from "@/components/profile/profile-title";
import { atHandle } from "@/lib/at-handle";

// The header of a Profile, named by its title, as `/profile`'s without its settings: the avatar
// with the full Aura of its Ornament, the Handle of today as the API spells it and the Duels played,
// the rank on its card.
export const ProfileHeader = ({ handle }: { handle: string }) => {
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle));
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex items-center gap-6">
      <ProfileAvatar handle={profile.handle} image={profile.image} ornament={profile.ornament} />
      <ProfileTitle
        id={titleId}
        title={atHandle(profile.handle)}
        line={<ProfileDuels handle={handle} />}
      />
      <ProfileRankCard rank={profile.rank} />
    </section>
  );
};
