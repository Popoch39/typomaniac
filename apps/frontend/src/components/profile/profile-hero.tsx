import { useId } from "react";

import type { Me } from "@/api/me";
import { ProfileHeroRank } from "@/components/profile/profile-hero-rank";
import { ProfilePublicLink } from "@/components/profile/profile-public-link";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The top of `/profile`, the Profil page, on a card named by its title: their avatar in large, shown
// with the full Aura of their Ornament; their Handle and how the others see them; their rank and
// its progress; the way to their public Profile. Until a Handle is chosen, their name, and why they
// need one.
export const ProfileHero = ({ me }: { me: Me }) => {
  const locale = useLocale();
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex items-center gap-7 rounded-card bg-card px-7.5 py-6.5"
    >
      <UserAvatar
        handle={me.handle ?? me.name}
        image={me.image}
        ornament={me.ornament}
        aura="full"
        className="size-26"
        fallbackClassName="bg-primary text-[34px] font-extrabold text-primary-foreground"
      />
      {/* Positioned after the avatar: drawn over the Ornament's overflow, never under it. */}
      <div className="relative flex min-w-0 flex-1 flex-col gap-1.5">
        <h1
          id={titleId}
          className="truncate text-[38px] leading-tight font-extrabold tracking-[-0.02em]"
        >
          {me.handle === null ? me.name : atHandle(me.handle)}
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {me.handle === null
            ? m.profile_no_handle({}, { locale })
            : m.profile_others_see_you({ handle: atHandle(me.handle) }, { locale })}
        </p>
      </div>
      <ProfileHeroRank rank={me.rank} />
      {me.handle === null ? null : <ProfilePublicLink handle={me.handle} />}
    </section>
  );
};
