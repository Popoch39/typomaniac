import { Link } from "@tanstack/react-router";

import type { PresentFriend } from "@/components/friends/online-friends";
import { presenceLabel } from "@/components/friends/presence-paint";
import { FriendAvatar } from "@/components/sidebar/friend-avatar";
import { RailTooltip } from "@/components/sidebar/rail-tooltip";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A Friend who is there, in the Rail: their avatar alone, the way to their Profile, their Handle
// and Presence in its tooltip. Défier waits for the whole sidebar or Friends.
export const RailFriendRow = ({ friend }: { friend: PresentFriend }) => {
  const locale = useLocale();
  const handle = atHandle(friend.handle);

  return (
    <li className="flex h-12 items-center justify-center">
      <RailTooltip
        label={m.sidebar_online_friend(
          { handle, presence: presenceLabel(friend.presence, locale) },
          { locale },
        )}
      >
        <Link
          to="/u/$handle"
          params={{ handle: friend.handle }}
          aria-label={handle}
          className="flex rounded-[33%] outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/50"
        >
          <FriendAvatar friend={friend} />
        </Link>
      </RailTooltip>
    </li>
  );
};
