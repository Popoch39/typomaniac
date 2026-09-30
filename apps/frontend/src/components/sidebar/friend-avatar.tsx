import { cn } from "cn";

import type { PresentFriend } from "@/components/friends/online-friends";
import { PRESENCE_DOTS } from "@/components/friends/presence-paint";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

// A Friend who is there, in the sidebar: their avatar with their Ornament, and the dot of their
// Presence at its corner.
export const FriendAvatar = ({ friend }: { friend: PresentFriend }) => (
  <span className="relative flex shrink-0">
    <UserAvatar handle={friend.handle} image={friend.image} ornament={friend.ornament} />
    <span
      aria-hidden
      className={cn(
        "absolute -right-0.75 -bottom-0.75 size-2.5 rounded-full ring-2 ring-sidebar",
        PRESENCE_DOTS[friend.presence],
      )}
    />
  </span>
);
