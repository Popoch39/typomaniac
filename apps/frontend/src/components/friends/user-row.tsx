import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { atHandle } from "@/lib/at-handle";
import { initials } from "@/lib/initials";

type UserRowProps = {
  user: { handle: string; image: string | null };
  // The actions on them, at the end of the row.
  children?: ReactNode;
};

// Another User in a list: their avatar and their Handle, nothing else of them.
export const UserRow = ({ user, children }: UserRowProps) => (
  <li className="flex items-center gap-3 px-3 py-2">
    <Avatar size="sm">
      {user.image ? <AvatarImage src={user.image} alt="" /> : null}
      <AvatarFallback>{initials(user.handle)}</AvatarFallback>
    </Avatar>
    <span className="min-w-0 flex-1 truncate">{atHandle(user.handle)}</span>
    {children ? <div className="flex shrink-0 gap-1">{children}</div> : null}
  </li>
);
