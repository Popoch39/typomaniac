import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/initials";
import { relativeTime } from "@/lib/relative-time";

type ActivityRowProps = {
  // The Friend it is about: their avatar leads the row.
  friend: { handle: string; image: string | null };
  at: number;
  now: number;
  children: ReactNode;
};

// One Activity: the Friend's avatar, what happened, and how long ago.
export const ActivityRow = ({ friend, at, now, children }: ActivityRowProps) => (
  <li className="flex items-start gap-3 px-5 py-3">
    <Avatar>
      {friend.image ? <AvatarImage src={friend.image} alt="" /> : null}
      <AvatarFallback>{initials(friend.handle)}</AvatarFallback>
    </Avatar>
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className="text-sm">{children}</p>
      <time dateTime={new Date(at).toISOString()} className="text-xs text-muted-foreground">
        {relativeTime(at, now)}
      </time>
    </div>
  </li>
);
