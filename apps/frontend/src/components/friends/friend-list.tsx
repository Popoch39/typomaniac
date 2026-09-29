import { useSuspenseQuery } from "@tanstack/react-query";

import { friendsQueryOptions } from "@/api/friends";
import { FriendRow } from "@/components/friends/friend-row";
import { FriendsEmpty } from "@/components/friends/friends-empty";
import { FriendsListSection } from "@/components/friends/friends-list-section";

// The User's Friends, by Handle, each with their Presence: one online can be challenged.
type FriendListProps = {
  // Where the empty list sends the User to find some.
  searchInputId: string;
};

export const FriendList = ({ searchInputId }: FriendListProps) => {
  const { data: friends } = useSuspenseQuery(friendsQueryOptions);

  return (
    <FriendsListSection
      title={`Friends · ${friends.length}`}
      isEmpty={friends.length === 0}
      empty={<FriendsEmpty searchInputId={searchInputId} />}
    >
      {friends.map((friend) => (
        <FriendRow key={friend.id} friend={friend} />
      ))}
    </FriendsListSection>
  );
};
