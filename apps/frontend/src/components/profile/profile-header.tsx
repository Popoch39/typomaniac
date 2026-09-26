import { useSuspenseQuery } from "@tanstack/react-query";

import { profileQueryOptions } from "@/api/profile";
import { ProfileRank } from "@/components/profile/profile-rank";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { atHandle } from "@/lib/at-handle";

// The top of a Profile, on a card: the squircle avatar and the Handle of today, as the API spells it.
export const ProfileHeader = ({ handle }: { handle: string }) => {
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle));

  return (
    <div className="flex items-center gap-4 rounded-card bg-card p-5">
      <UserAvatar
        handle={profile.handle}
        image={profile.image}
        ornament={profile.ornament}
        className="size-16"
        fallbackClassName="bg-primary text-lg font-bold text-primary-foreground"
      />
      {/* Positioned after the avatar: drawn over the Ornament's overflow, never under it. */}
      <h1 className="relative text-3xl font-extrabold tracking-tight">
        {atHandle(profile.handle)}
      </h1>
      {profile.rank ? <ProfileRank rank={profile.rank} /> : null}
    </div>
  );
};
