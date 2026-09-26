import type { ReactNode } from "react";
import type { Tier } from "ranked";

import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { relativeTime } from "@/lib/relative-time";

type ActivityRowProps = {
  // The Friend it is about: their avatar, with their Ornament, leads the row.
  friend: { handle: string; image: string | null; ornament: Tier | null };
  at: number;
  now: number;
  children: ReactNode;
};

// One Activity: the Friend's avatar, what happened, and how long ago.
export const ActivityRow = ({ friend, at, now, children }: ActivityRowProps) => (
  <li className="flex items-start gap-3 px-5 py-3">
    <UserAvatar handle={friend.handle} image={friend.image} ornament={friend.ornament} />
    {/* Positioned after the avatar: drawn over the Ornament's overflow, never under it. */}
    <div className="relative flex min-w-0 flex-1 flex-col gap-1">
      <p className="text-sm">{children}</p>
      <time dateTime={new Date(at).toISOString()} className="text-xs text-muted-foreground">
        {relativeTime(at, now)}
      </time>
    </div>
  </li>
);
