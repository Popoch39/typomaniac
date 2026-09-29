import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { OnlineFriendsSection } from "@/components/sidebar/online-friends-section";

// Under the nav, for a User with a Handle only: a Visitor has no Friends, nor has a User before
// choosing a Handle.
export const SidebarOnlineFriends = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  return me?.handle ? <OnlineFriendsSection /> : null;
};
