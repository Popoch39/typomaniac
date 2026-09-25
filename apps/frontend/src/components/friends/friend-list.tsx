import { useSuspenseQuery } from "@tanstack/react-query";

import { friendsQueryOptions } from "@/api/friends";
import { ChallengeButton } from "@/components/challenge/challenge-button";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { FriendsEmpty } from "@/components/friends/friends-empty";
import { FriendPresence } from "@/components/friends/friend-presence";
import { FriendsListSection } from "@/components/friends/friends-list-section";
import { UserRow } from "@/components/friends/user-row";
import { atHandle } from "@/lib/at-handle";

// The User's Friends, by Handle, each with their Presence: one online can be challenged. Removing
// one needs no say from them.
type FriendListProps = {
  // Where the empty list sends the User to find some.
  searchInputId: string;
};

export const FriendList = ({ searchInputId }: FriendListProps) => {
  const { data: friends } = useSuspenseQuery(friendsQueryOptions);

  return (
    <FriendsListSection
      title="Friends"
      count={friends.length}
      empty={<FriendsEmpty searchInputId={searchInputId} />}
    >
      {friends.map((friend) => (
        <UserRow key={friend.id} user={friend} aside={<FriendPresence userId={friend.id} />}>
          <ChallengeButton friend={friend} />
          <FriendActionButton
            action="remove"
            userId={friend.id}
            variant="ghost"
            label={`Retirer ${atHandle(friend.handle)} de tes Friends`}
          >
            Retirer
          </FriendActionButton>
        </UserRow>
      ))}
    </FriendsListSection>
  );
};
