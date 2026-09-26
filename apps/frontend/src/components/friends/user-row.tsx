import type { ReactNode } from "react";

import { HandleLink } from "@/components/handle/handle-link";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

type UserRowProps = {
  user: { handle: string; image: string | null };
  // Shown after their Handle: a Friend's Presence.
  aside?: ReactNode;
  // The actions on them, at the end of the row.
  children?: ReactNode;
};

// Another User in a list: their avatar and their Handle, nothing else of them.
export const UserRow = ({ user, aside, children }: UserRowProps) => (
  <li className="flex items-center gap-3 px-5 py-3">
    <UserAvatar handle={user.handle} image={user.image} />
    <span className="min-w-0 flex-1 truncate">
      <HandleLink handle={user.handle} />
    </span>
    {aside}
    {children ? <div className="flex shrink-0 gap-2">{children}</div> : null}
  </li>
);
