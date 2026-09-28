import { QueueFriendsList } from "@/components/duel/queue-friends-list";
import { UserRowsSkeleton } from "@/components/friends/user-rows-skeleton";
import { useOnlineFriends } from "@/components/friends/use-online-friends";

// Beside the search: the Friends online and free, each to challenge. The User stays in the Queue
// meanwhile; whichever comes first, a pairing or an accepted Challenge, is their Duel. The list
// never holds up the search.
export const QueueFriends = () => {
  const online = useOnlineFriends();

  return (
    <aside
      aria-labelledby="queue-friends-title"
      className="flex flex-col gap-3 rounded-card bg-card py-5"
    >
      <h2 id="queue-friends-title" className="px-5 font-bold">
        Ou défie un ami
      </h2>
      {online === null ? (
        <UserRowsSkeleton label="Chargement des Friends en ligne" />
      ) : (
        <QueueFriendsList
          friends={online.present.filter((friend) => friend.presence === "online")}
        />
      )}
    </aside>
  );
};
