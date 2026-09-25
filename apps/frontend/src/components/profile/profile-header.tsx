import { useSuspenseQuery } from "@tanstack/react-query";

import { profileQueryOptions } from "@/api/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { atHandle } from "@/lib/at-handle";
import { initials } from "@/lib/initials";

// The top of a Profile, on a card: the squircle avatar and the Handle of today, as the API spells it.
export const ProfileHeader = ({ handle }: { handle: string }) => {
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle));

  return (
    <div className="flex items-center gap-4 rounded-card bg-card p-5">
      <Avatar className="size-16">
        {profile.image ? <AvatarImage src={profile.image} alt="" /> : null}
        <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
          {initials(profile.handle)}
        </AvatarFallback>
      </Avatar>
      <h1 className="text-3xl font-extrabold tracking-tight">{atHandle(profile.handle)}</h1>
    </div>
  );
};
