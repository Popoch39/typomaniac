import type { Friend } from "@/api/friends";
import { ChallengeButton } from "@/components/challenge/challenge-button";
import { UserRow } from "@/components/friends/user-row";

type QueueFriendsListProps = {
  // The Friends online and free.
  friends: readonly Friend[];
};

// Each Friend to challenge, or why there is none.
export const QueueFriendsList = ({ friends }: QueueFriendsListProps) =>
  friends.length === 0 ? (
    <p className="px-5 text-sm text-muted-foreground">
      Aucun Friend en ligne pour l'instant : ils apparaîtront ici dès qu'ils seront libres.
    </p>
  ) : (
    <ul className="flex flex-col">
      {friends.map((friend) => (
        <UserRow key={friend.id} user={friend}>
          <ChallengeButton friend={friend} />
        </UserRow>
      ))}
    </ul>
  );
