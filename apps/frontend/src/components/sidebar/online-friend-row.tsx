import { cn } from "cn";

import { ChallengeButton } from "@/components/challenge/challenge-button";
import type { PresentFriend } from "@/components/friends/online-friends";
import { PRESENCE_DOTS, PRESENCE_LABELS } from "@/components/friends/presence-paint";
import { HandleLink } from "@/components/handle/handle-link";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

// A Friend who is there, in the sidebar: avatar with their Ornament and the dot of their
// Presence, Handle, the Presence in words, and Défier while they are online. Tighter than
// `UserRow`, whose padding is meant for a card.
export const OnlineFriendRow = ({ friend }: { friend: PresentFriend }) => (
  <li className="flex h-12 items-center gap-2.5 pl-2.5">
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
    {/* Positioned after the avatar: drawn over the Ornament's overflow, never under it. */}
    <span className="relative flex min-w-0 flex-1 flex-col">
      <HandleLink handle={friend.handle} className="truncate text-sm font-semibold" />
      <span className="text-xs text-muted-foreground">{PRESENCE_LABELS[friend.presence]}</span>
    </span>
    {friend.presence === "online" ? (
      <span className="relative">
        <ChallengeButton friend={friend} iconOnly />
      </span>
    ) : null}
  </li>
);
