import { useSuspenseQuery } from "@tanstack/react-query";

import { friendRequestsQueryOptions } from "@/api/friends";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { FriendRequestsCount } from "@/components/friends/friend-requests-count";
import { FriendsListSection } from "@/components/friends/friends-list-section";
import { UserRow } from "@/components/friends/user-row";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Friend requests waiting for the User's answer. Declining is silent: the sender is not told.
export const FriendRequestsReceived = () => {
  const { data: received } = useSuspenseQuery({
    ...friendRequestsQueryOptions,
    select: (requests) => requests.received,
  });

  const locale = useLocale();

  return (
    <FriendsListSection
      title={
        <>
          {m.friends_received_title({}, { locale })}{" "}
          {received.length > 0 ? <FriendRequestsCount count={received.length} /> : null}
        </>
      }
      isEmpty={received.length === 0}
      empty={
        <p className="px-1 text-sm text-muted-foreground">
          {m.friends_received_none({}, { locale })}
        </p>
      }
    >
      {received.map((user) => {
        const handle = atHandle(user.handle);

        return (
          <UserRow key={user.id} user={user}>
            <FriendActionButton
              action="accept"
              userId={user.id}
              variant="default"
              label={m.friends_accept_label({ handle }, { locale })}
            >
              {m.friends_accept({}, { locale })}
            </FriendActionButton>
            <FriendActionButton
              action="decline"
              userId={user.id}
              variant="ghost"
              label={m.friends_decline_label({ handle }, { locale })}
            >
              {m.friends_decline({}, { locale })}
            </FriendActionButton>
          </UserRow>
        );
      })}
    </FriendsListSection>
  );
};
