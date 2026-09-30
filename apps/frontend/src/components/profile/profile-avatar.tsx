import type { Tier } from "ranked";

import { UserAvatar } from "@/components/user-avatar/user-avatar";

type ProfileAvatarProps = { handle: string; image: string | null; ornament: Tier | null };

// The avatar of a Profile's header, shown with the full Aura of its Ornament; its initials in the
// accent on the raised surface. The Ornament, twice the avatar, gets its whole room (128 px): the
// header's star, it never runs over the Handle nor the tiles below. Only its light spills out. Kept
// low enough for the Stats' bento to fit under it in a 720 px window.
export const ProfileAvatar = ({ handle, image, ornament }: ProfileAvatarProps) => {
  const avatar = (
    <UserAvatar
      handle={handle}
      image={image}
      ornament={ornament}
      aura="full"
      className="size-16"
      fallbackClassName="bg-surface-2 text-2xl font-extrabold text-caret"
    />
  );

  return ornament === null ? (
    avatar
  ) : (
    <div className="flex size-32 shrink-0 items-center justify-center">{avatar}</div>
  );
};
