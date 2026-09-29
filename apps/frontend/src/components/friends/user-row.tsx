import type { ReactNode } from "react";
import type { Tier } from "ranked";

import { HandleLink } from "@/components/handle/handle-link";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

type UserRowProps = {
  user: { handle: string; image: string | null; ornament: Tier | null };
  // Shown after their Handle: a Friend's Presence, a request still waiting.
  aside?: ReactNode;
  // The actions on them, at the end of the row.
  children?: ReactNode;
};

// Another User in a list on its card, 56 px high: their avatar with their Ornament and their
// Handle, nothing else of them.
export const UserRow = ({ user, aside, children }: UserRowProps) => (
  <li className="flex h-14 items-center gap-3 pr-1.5 pl-3">
    <UserAvatar
      handle={user.handle}
      image={user.image}
      ornament={user.ornament}
      className="size-9"
      fallbackClassName="bg-surface-2 text-[13px] font-bold text-foreground"
    />
    {/* Positioned after the avatar: drawn over the Ornament's overflow, never under it. */}
    <span className="relative min-w-0 flex-1 truncate text-[15px] font-semibold">
      <HandleLink handle={user.handle} />
    </span>
    {aside}
    {children ? <div className="relative flex shrink-0 gap-3">{children}</div> : null}
  </li>
);
