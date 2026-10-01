import type { FriendRequests } from "@/api/friends";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { FriendsGridRow } from "@/components/friends/friends-grid-row";
import { FRIENDS_PANEL_NOTE_PAINT } from "@/components/friends/friends-paint";
import { FriendsPanel } from "@/components/friends/friends-panel";
import { FriendsRowStatus } from "@/components/friends/friends-row-status";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type FriendRequestsReceivedProps = { received: FriendRequests["received"] };

// The Friend requests waiting for the User's answer, under their tab: Accepter on the accent,
// Refuser quieter. Declining is silent: the sender is not told.
export const FriendRequestsReceived = ({ received }: FriendRequestsReceivedProps) => {
  const locale = useLocale();

  return (
    <FriendsPanel
      value="requests"
      isEmpty={received.length === 0}
      empty={<p className={FRIENDS_PANEL_NOTE_PAINT}>{m.friends_received_none({}, { locale })}</p>}
    >
      {received.map((user) => {
        const handle = atHandle(user.handle);

        return (
          <FriendsGridRow
            key={user.id}
            user={user}
            status={
              <FriendsRowStatus dot="bg-brand">
                {m.friends_received_status({}, { locale })}
              </FriendsRowStatus>
            }
          >
            <FriendActionButton
              action="decline"
              userId={user.id}
              variant="ghost"
              label={m.friends_decline_label({ handle }, { locale })}
            >
              {m.friends_decline({}, { locale })}
            </FriendActionButton>
            <FriendActionButton
              action="accept"
              userId={user.id}
              variant="default"
              label={m.friends_accept_label({ handle }, { locale })}
            >
              {m.friends_accept({}, { locale })}
            </FriendActionButton>
          </FriendsGridRow>
        );
      })}
    </FriendsPanel>
  );
};
