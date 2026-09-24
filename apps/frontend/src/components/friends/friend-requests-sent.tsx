import { useSuspenseQuery } from "@tanstack/react-query";

import { friendRequestsQueryOptions } from "@/api/friends";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { FriendsListSection } from "@/components/friends/friends-list-section";
import { UserRow } from "@/components/friends/user-row";
import { atHandle } from "@/lib/at-handle";

// The Friend requests the User sent, still waiting for an answer.
export const FriendRequestsSent = () => {
  const { data: sent } = useSuspenseQuery({
    ...friendRequestsQueryOptions,
    select: (requests) => requests.sent,
  });

  return (
    <FriendsListSection
      title="Friend requests envoyées"
      count={sent.length}
      empty="Aucune Friend request envoyée en attente."
    >
      {sent.map((user) => (
        <UserRow key={user.id} user={user}>
          <FriendActionButton
            action="cancel"
            userId={user.id}
            variant="ghost"
            label={`Annuler la Friend request à ${atHandle(user.handle)}`}
          >
            Annuler
          </FriendActionButton>
        </UserRow>
      ))}
    </FriendsListSection>
  );
};
