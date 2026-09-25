import { useSuspenseQuery } from "@tanstack/react-query";

import { profileQueryOptions } from "@/api/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { atHandle } from "@/lib/at-handle";
import { initials } from "@/lib/initials";

// The top of a Profile: the avatar and the Handle of today, as the API spells it.
export const ProfileHeader = ({ handle }: { handle: string }) => {
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle));

  return (
    <div className="flex items-center gap-3">
      <Avatar size="lg">
        {profile.image ? <AvatarImage src={profile.image} alt="" /> : null}
        <AvatarFallback>{initials(profile.handle)}</AvatarFallback>
      </Avatar>
      <h1 className="text-lg font-bold">{atHandle(profile.handle)}</h1>
    </div>
  );
};
