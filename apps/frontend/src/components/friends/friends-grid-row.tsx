import type { ReactNode } from "react";
import type { Tier } from "ranked";

import { HandleLink } from "@/components/handle/handle-link";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

type FriendsGridRowProps = {
  user: { handle: string; image: string | null; ornament: Tier | null };
  // Under their Handle: a Friend's Presence, a request waiting.
  status?: ReactNode;
  // The actions on them, at the end of the row.
  children?: ReactNode;
};

// Another User under a tab of the Friends page, 64 px high: their avatar with their Ornament, their
// Handle and what stands between them and the User, then the actions.
export const FriendsGridRow = ({ user, status, children }: FriendsGridRowProps) => (
  <li className="group/row flex h-16 items-center gap-3 rounded-[18px] pr-2.5 pl-3">
    <UserAvatar
      handle={user.handle}
      image={user.image}
      ornament={user.ornament}
      className="size-10"
      fallbackClassName="bg-surface-2 text-sm font-extrabold text-foreground"
    />
    {/* Positioned after the avatar: drawn over the Ornament's overflow, never under it. */}
    <span className="relative flex min-w-0 flex-1 flex-col gap-0.75">
      <HandleLink handle={user.handle} className="truncate text-[15px] font-bold" />
      {status}
    </span>
    {children ? (
      <div className="relative flex shrink-0 items-center gap-1.5">{children}</div>
    ) : null}
  </li>
);
