import type { Friend } from "@/api/friends";
import { ChallengeButton } from "@/components/challenge/challenge-button";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { FriendPresence } from "@/components/friends/friend-presence";
import { useFriendPresence } from "@/components/friends/use-friend-presence";
import { UserRow } from "@/components/friends/user-row";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// One of the User's Friends: their Presence once the connection tells it, Défier while they are
// online, and Retirer, which needs no say from them.
export const FriendRow = ({ friend }: { friend: Friend }) => {
  const presence = useFriendPresence(friend.id);
  const locale = useLocale();

  return (
    <UserRow
      user={friend}
      aside={presence === null ? null : <FriendPresence presence={presence} />}
    >
      {presence === "online" ? <ChallengeButton friend={friend} /> : null}
      <FriendActionButton
        action="remove"
        userId={friend.id}
        variant="ghost"
        label={m.friends_remove_label({ handle: atHandle(friend.handle) }, { locale })}
        className="px-3"
      >
        {m.friends_remove({}, { locale })}
      </FriendActionButton>
    </UserRow>
  );
};
