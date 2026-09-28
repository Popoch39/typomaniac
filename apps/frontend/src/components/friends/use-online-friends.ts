import { useQuery } from "@tanstack/react-query";

import { friendsQueryOptions } from "@/api/friends";
import { presentFriends } from "@/components/friends/online-friends";
import { useConnectionStore } from "@/stores/connection-store";

// The User's Friends who are there, online or in a Duel, and how many Friends they have: null
// until both the list and the Presences are read. Never holds up what surrounds it.
export const useOnlineFriends = () => {
  const { data: friends } = useQuery(friendsQueryOptions);
  const presences = useConnectionStore((store) => store.friends?.presences ?? null);

  return friends === undefined || presences === null
    ? null
    : { present: presentFriends(friends, presences), friendCount: friends.length };
};
