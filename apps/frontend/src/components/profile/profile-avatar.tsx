import type { Tier } from "ranked";

import { UserAvatar } from "@/components/user-avatar/user-avatar";

type ProfileAvatarProps = { handle: string; image: string | null; ornament: Tier | null };

// The avatar of a Profile's header, large enough to give off the full Aura of its Ornament; its
// initials in the accent on the raised surface. The Ornament, twice the avatar, gets its whole room:
// the header's star, it never runs over the Handle nor the card below. Only its light spills out.
export const ProfileAvatar = ({ handle, image, ornament }: ProfileAvatarProps) => {
  const avatar = (
    <UserAvatar
      handle={handle}
      image={image}
      ornament={ornament}
      aura="full"
      className="size-22"
      fallbackClassName="bg-surface-2 text-[34px] font-extrabold text-caret"
    />
  );

  return ornament === null ? (
    avatar
  ) : (
    <div className="flex size-44 shrink-0 items-center justify-center">{avatar}</div>
  );
};
