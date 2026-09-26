import type { ReactNode } from "react";
import type { Tier } from "ranked";

import { HandleLink } from "@/components/handle/handle-link";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

type UserRowProps = {
  user: { handle: string; image: string | null; ornament: Tier | null };
  // Shown after their Handle: a Friend's Presence.
  aside?: ReactNode;
  // The actions on them, at the end of the row.
  children?: ReactNode;
};

// Another User in a list: their avatar with their Ornament and their Handle, nothing else of them.
export const UserRow = ({ user, aside, children }: UserRowProps) => (
  <li className="flex items-center gap-3 px-5 py-3">
    <UserAvatar handle={user.handle} image={user.image} ornament={user.ornament} />
    {/* Positioned after the avatar: drawn over the Ornament's overflow, never under it. */}
    <span className="relative min-w-0 flex-1 truncate">
      <HandleLink handle={user.handle} />
    </span>
    {aside}
    {children ? <div className="relative flex shrink-0 gap-2">{children}</div> : null}
  </li>
);
