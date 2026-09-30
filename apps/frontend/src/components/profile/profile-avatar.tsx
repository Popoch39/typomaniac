import type { Tier } from "ranked";

import { UserAvatar } from "@/components/user-avatar/user-avatar";

type ProfileAvatarProps = { handle: string; image: string | null; ornament: Tier | null };

// The avatar of a Profile's header, large enough to give off the full Aura of its Ornament; its
// initials in the accent on the raised surface.
export const ProfileAvatar = ({ handle, image, ornament }: ProfileAvatarProps) => (
  <UserAvatar
    handle={handle}
    image={image}
    ornament={ornament}
    aura="full"
    className="size-24"
    fallbackClassName="bg-surface-2 text-[38px] font-extrabold text-caret"
  />
);
