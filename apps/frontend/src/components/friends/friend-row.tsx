import type { Friend } from "@/api/friends";
import { ChallengeButton } from "@/components/challenge/challenge-button";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { FriendsGridRow } from "@/components/friends/friends-grid-row";
import { FriendsRowStatus } from "@/components/friends/friends-row-status";
import { PRESENCE_DOTS, presenceLabel } from "@/components/friends/presence-paint";
import { useFriendPresence } from "@/components/friends/use-friend-presence";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// One of the User's Friends: their Presence once the connection tells it, Défier while they are
// online. Retirer, which needs no say from them, shows on the row's hover or its focus only.
export const FriendRow = ({ friend }: { friend: Friend }) => {
  const presence = useFriendPresence(friend.id);
  const locale = useLocale();

  return (
    <FriendsGridRow
      user={friend}
      status={
        presence === null ? null : (
          <FriendsRowStatus dot={PRESENCE_DOTS[presence]}>
            {presenceLabel(presence, locale)}
          </FriendsRowStatus>
        )
      }
    >
      {/* Hidden on its wrapper: the button's own padding would win over `sr-only`'s. */}
      <span className="sr-only group-hover/row:not-sr-only focus-within:not-sr-only">
        <FriendActionButton
          action="remove"
          userId={friend.id}
          variant="ghost"
          label={m.friends_remove_label({ handle: atHandle(friend.handle) }, { locale })}
        >
          {m.friends_remove({}, { locale })}
        </FriendActionButton>
      </span>
      {presence === "online" ? <ChallengeButton friend={friend} /> : null}
    </FriendsGridRow>
  );
};
