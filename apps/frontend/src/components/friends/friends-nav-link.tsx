import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { FriendRequestsBadge } from "@/components/friends/friend-requests-badge";
import { NavPill } from "@/components/ui/nav-pill";

// The way to the Friends, for a User with a Session only: a Visitor has none. With a Handle, the
// number of Friend requests received.
export const FriendsNavLink = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  return me ? (
    <NavPill to="/friends">
      Friends
      {me.handle === null ? null : <FriendRequestsBadge />}
    </NavPill>
  ) : null;
};
