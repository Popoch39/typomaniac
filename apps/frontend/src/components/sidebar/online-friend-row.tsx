import { ChallengeButton } from "@/components/challenge/challenge-button";
import type { PresentFriend } from "@/components/friends/online-friends";
import { presenceLabel } from "@/components/friends/presence-paint";
import { HandleLink } from "@/components/handle/handle-link";
import { FriendAvatar } from "@/components/sidebar/friend-avatar";
import { useLocale } from "@/locale/use-locale";

// A Friend who is there, in the sidebar: avatar with their Ornament and the dot of their
// Presence, Handle, the Presence in words, and Défier while they are online. Tighter than
// `UserRow`, whose padding is meant for a card.
export const OnlineFriendRow = ({ friend }: { friend: PresentFriend }) => {
  const locale = useLocale();

  return (
    <li className="flex h-12 items-center gap-2.5 pl-2.5">
      <FriendAvatar friend={friend} />
      {/* Positioned after the avatar: drawn over the Ornament's overflow, never under it. */}
      <span className="relative flex min-w-0 flex-1 flex-col">
        <HandleLink handle={friend.handle} className="truncate text-sm font-semibold" />
        <span className="text-xs text-muted-foreground">
          {presenceLabel(friend.presence, locale)}
        </span>
      </span>
      {friend.presence === "online" ? (
        <span className="relative">
          <ChallengeButton friend={friend} iconOnly />
        </span>
      ) : null}
    </li>
  );
};
