import { Suspense, useId } from "react";

import type { Me } from "@/api/me";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileDuels } from "@/components/profile/profile-duels";
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog";
import { ProfileRankCard } from "@/components/profile/profile-rank-card";
import { ProfileTitle } from "@/components/profile/profile-title";
import { Skeleton } from "@/components/ui/skeleton";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The header of `/profile`, the Profil page, named by its title, read from `/me` without waiting for
// the Stats: the avatar with the full Aura of its Ornament; the Handle and the Duels played; the
// rank on its card; « Modifier le profil ». Until a Handle is chosen, their name, and why they need
// one.
export const ProfileHero = ({ me }: { me: Me }) => {
  const locale = useLocale();
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex items-center gap-6">
      <ProfileAvatar handle={me.handle ?? me.name} image={me.image} ornament={me.ornament} />
      <ProfileTitle
        id={titleId}
        title={me.handle === null ? me.name : atHandle(me.handle)}
        line={
          me.handle === null ? (
            m.profile_no_handle({}, { locale })
          ) : (
            <Suspense fallback={<Skeleton className="h-5 w-20" />}>
              <ProfileDuels handle={me.handle} />
            </Suspense>
          )
        }
      />
      <ProfileRankCard rank={me.rank} />
      <ProfileEditDialog me={me} />
    </section>
  );
};
