import { useSuspenseQuery } from "@tanstack/react-query";

import { friendsQueryOptions } from "@/api/friends";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { FriendsListSection } from "@/components/friends/friends-list-section";
import { UserRow } from "@/components/friends/user-row";
import { atHandle } from "@/lib/at-handle";

// The User's Friends, by Handle. Removing one needs no say from them.
export const FriendList = () => {
  const { data: friends } = useSuspenseQuery(friendsQueryOptions);

  return (
    <FriendsListSection
      title="Friends"
      count={friends.length}
      empty="Pas encore de Friends : cherche un User par son Handle."
    >
      {friends.map((friend) => (
        <UserRow key={friend.id} user={friend}>
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
