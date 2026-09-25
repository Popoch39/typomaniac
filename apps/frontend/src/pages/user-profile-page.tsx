import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { UserProfileEmpty } from "@/components/profile/user-profile-empty";
import { SignInInvitation } from "@/components/profile/sign-in-invitation";

// A User's Profile, as any signed-in User sees it: their Handle, their avatar and their Stats.
// Never their Duel history, their Duel charts or their Replays.
export const UserProfilePage = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const handle = useParams({ from: "/u/$handle", select: (params) => params.handle });

  if (me === null) {
    return (
      <SignInInvitation title="Profile" reason="Connecte-toi pour voir le Profile de ce User." />
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-12">
      <ProfileHeader handle={handle} />
      <ProfileStats handle={handle} empty={<UserProfileEmpty />} />
    </section>
  );
};
