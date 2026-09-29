import type { Friend } from "@/api/friends";
import { ChallengeButton } from "@/components/challenge/challenge-button";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { FriendPresence } from "@/components/friends/friend-presence";
import { useFriendPresence } from "@/components/friends/use-friend-presence";
import { UserRow } from "@/components/friends/user-row";
import { atHandle } from "@/lib/at-handle";

// One of the User's Friends: their Presence once the connection tells it, Défier while they are
// online, and Retirer, which needs no say from them.
export const FriendRow = ({ friend }: { friend: Friend }) => {
  const presence = useFriendPresence(friend.id);

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
        label={`Retirer ${atHandle(friend.handle)} de tes Friends`}
        className="px-3"
      >
        Retirer
      </FriendActionButton>
    </UserRow>
  );
};
