import type { FriendRequests } from "@/api/friends";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { FriendsGridRow } from "@/components/friends/friends-grid-row";
import { FRIENDS_PANEL_NOTE_PAINT } from "@/components/friends/friends-paint";
import { FriendsPanel } from "@/components/friends/friends-panel";
import { FriendsRowStatus } from "@/components/friends/friends-row-status";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type FriendRequestsSentProps = { sent: FriendRequests["sent"] };

// The Friend requests the User sent, still waiting for an answer, under their tab: each can be
// cancelled.
export const FriendRequestsSent = ({ sent }: FriendRequestsSentProps) => {
  const locale = useLocale();

  return (
    <FriendsPanel
      value="sent"
      isEmpty={sent.length === 0}
      empty={<p className={FRIENDS_PANEL_NOTE_PAINT}>{m.friends_sent_none({}, { locale })}</p>}
    >
      {sent.map((user) => (
        <FriendsGridRow
          key={user.id}
          user={user}
          status={
            <FriendsRowStatus dot="bg-faint">
              {m.friends_sent_pending({}, { locale })}
            </FriendsRowStatus>
          }
        >
          <FriendActionButton
            action="cancel"
            userId={user.id}
            variant="ghost"
            label={m.friends_cancel_label({ handle: atHandle(user.handle) }, { locale })}
          >
            {m.friends_cancel({}, { locale })}
          </FriendActionButton>
        </FriendsGridRow>
      ))}
    </FriendsPanel>
  );
};
