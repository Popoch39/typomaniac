import type { Friend } from "@/api/friends";
import { FriendRow } from "@/components/friends/friend-row";
import { FriendsEmpty } from "@/components/friends/friends-empty";
import { FriendsPanel } from "@/components/friends/friends-panel";
import { offlineLast } from "@/components/friends/online-friends";
import { useConnectionStore } from "@/stores/connection-store";

type FriendListProps = {
  friends: readonly Friend[];
  // Where the empty list sends the User to find some.
  searchInputId: string;
};

// The User's Friends under their tab, each with their Presence: the ones there first, in the list's
// order, then the ones offline. One online can be challenged.
export const FriendList = ({ friends, searchInputId }: FriendListProps) => {
  const presences = useConnectionStore((store) => store.friends?.presences ?? null);

  const ordered = presences === null ? friends : offlineLast(friends, presences);

  return (
    <FriendsPanel
      value="friends"
      isEmpty={friends.length === 0}
      empty={<FriendsEmpty searchInputId={searchInputId} />}
    >
      {ordered.map((friend) => (
        <FriendRow key={friend.id} friend={friend} />
      ))}
    </FriendsPanel>
  );
};
