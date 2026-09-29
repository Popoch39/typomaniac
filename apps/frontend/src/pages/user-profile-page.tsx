import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { UserProfileEmpty } from "@/components/profile/user-profile-empty";
import { SignInInvitation } from "@/components/profile/sign-in-invitation";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A User's Profile, as any signed-in User sees it: their Handle, their avatar and their Stats.
// Never their Duel history, their Duel charts or their Replays.
export const UserProfilePage = () => {
  const locale = useLocale();
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const handle = useParams({ from: "/u/$handle", select: (params) => params.handle });

  if (me === null) {
    return (
      <SignInInvitation
        title={m.profile_title({}, { locale })}
        reason={m.profile_sign_in_reason({}, { locale })}
      />
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <ProfileHeader handle={handle} />
      <ProfileStats handle={handle} empty={<UserProfileEmpty />} />
    </section>
  );
};
