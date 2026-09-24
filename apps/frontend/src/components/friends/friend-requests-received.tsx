import { useSuspenseQuery } from "@tanstack/react-query";

import { friendRequestsQueryOptions } from "@/api/friends";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { FriendsListSection } from "@/components/friends/friends-list-section";
import { UserRow } from "@/components/friends/user-row";
import { atHandle } from "@/lib/at-handle";

// The Friend requests waiting for the User's answer. Declining is silent: the sender is not told.
export const FriendRequestsReceived = () => {
  const { data: received } = useSuspenseQuery({
    ...friendRequestsQueryOptions,
    select: (requests) => requests.received,
  });

  return (
    <FriendsListSection
      title="Friend requests reçues"
      count={received.length}
      empty="Aucune Friend request en attente."
    >
      {received.map((user) => (
        <UserRow key={user.id} user={user}>
          <FriendActionButton
            action="accept"
            userId={user.id}
            variant="default"
            label={`Accepter la Friend request de ${atHandle(user.handle)}`}
          >
            Accepter
          </FriendActionButton>
          <FriendActionButton
            action="decline"
            userId={user.id}
            variant="ghost"
            label={`Refuser la Friend request de ${atHandle(user.handle)}`}
          >
            Refuser
          </FriendActionButton>
        </UserRow>
      ))}
    </FriendsListSection>
  );
};
