import { type DuelStore, outcomeFor, type RecentDuel } from "../duel/store";
import type { Friendship, FriendStore } from "../friend/store";
import type { HandleMatch, Users } from "../user/users";
import type { Activities, Activity } from "./model";

// How many Activities the User sees, the newest.
export const ACTIVITY_LIMIT = 50;

export type ActivityDeps = { duelStore: DuelStore; friendStore: FriendStore; users: Users };

type Profiles = ReadonlyMap<string, HandleMatch>;

// The Duel with a Friend of the reader first; left out when that Friend cannot be read.
export const duelActivity = (
  duel: RecentDuel,
  friends: ReadonlySet<string>,
  profiles: Profiles,
): Activity[] => {
  const friendPlayer = duel.players.find((player) => friends.has(player.userId));
  const friend = friendPlayer && profiles.get(friendPlayer.userId);

  if (!friendPlayer || !friend) {
    return [];
  }

  const opponentPlayer = duel.players.find((player) => player !== friendPlayer);
  const opponent = opponentPlayer && profiles.get(opponentPlayer.userId);

  return [
    {
      type: "duel",
      id: duel.id,
      at: duel.endedAt,
      forfeit: duel.outcome === "forfeit",
      friend: { ...friend, wpm: friendPlayer.wpm, outcome: outcomeFor(friend.id, duel) },
      opponent:
        opponentPlayer && opponent
          ? { ...opponent, wpm: opponentPlayer.wpm, outcome: outcomeFor(opponent.id, duel) }
          : null,
    },
  ];
};

// The friendship with a Friend of the reader first: the reader's own friendships too.
export const friendshipActivity = (
  { pair, createdAt }: Friendship,
  friends: ReadonlySet<string>,
  profiles: Profiles,
): Activity[] => {
  const [friendId, otherId] = friends.has(pair[0]) ? pair : [pair[1], pair[0]];
  const friend = profiles.get(friendId);
  const other = profiles.get(otherId);

  return friend && other
    ? [{ type: "friendship", id: pair.join(":"), at: createdAt, friend, other }]
    : [];
};

// What the User sees of their Friends of today, derived from the Duels and the friendships: an
// ended friendship takes the ex-Friend's Activities with it, a new one brings their past.
export const activityOf = async (
  { duelStore, friendStore, users }: ActivityDeps,
  userId: string,
): Promise<Activities> => {
  const friendIds = await friendStore.friendIds(userId);

  if (friendIds.length === 0) {
    return [];
  }

  const [duels, friendships] = await Promise.all([
    duelStore.recentDuelsOf(friendIds, ACTIVITY_LIMIT),
    friendStore.recentFriendshipsOf(friendIds, ACTIVITY_LIMIT),
  ]);

  const ids = new Set([
    ...duels.flatMap((duel) => duel.players.map((player) => player.userId)),
    ...friendships.flatMap(({ pair }) => pair),
  ]);

  const profiles = new Map((await users.profilesOf([...ids])).map((user) => [user.id, user]));
  const friends = new Set(friendIds);

  return [
    ...duels.flatMap((duel) => duelActivity(duel, friends, profiles)),
    ...friendships.flatMap((friendship) => friendshipActivity(friendship, friends, profiles)),
  ]
    .toSorted((a, b) => b.at - a.at)
    .slice(0, ACTIVITY_LIMIT);
};
