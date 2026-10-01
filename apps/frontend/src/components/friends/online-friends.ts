import type { Presence } from "api";

import type { Friend } from "@/api/friends";

// A Friend who is there: online, to challenge, or in a Duel.
export type PresentFriend = Friend & { presence: Exclude<Presence, "offline"> };

// The sidebar shows no more Friends than this; the rest are on /friends.
const SIDEBAR_ROWS = 5;

// The Friends online or in a Duel, with their Presence, in the list's order. A Friend whose
// Presence is not told is offline.
export const presentFriends = (
  friends: readonly Friend[],
  presences: ReadonlyMap<string, Presence>,
): PresentFriend[] =>
  friends.flatMap((friend) => {
    const presence = presences.get(friend.id) ?? "offline";

    return presence === "offline" ? [] : [{ ...friend, presence }];
  });

// The Friends in the list's order, the ones offline after those who are there. A Friend whose
// Presence is not told is offline.
export const offlineLast = (
  friends: readonly Friend[],
  presences: ReadonlyMap<string, Presence>,
): Friend[] => {
  const isOffline = (friend: Friend) => (presences.get(friend.id) ?? "offline") === "offline";

  return friends.toSorted((a, b) => Number(isOffline(a)) - Number(isOffline(b)));
};

// The rows of the sidebar's « En ligne »: those to challenge first, then those in a Duel, 5 at
// most; `count` is all the Friends who are there.
export const sidebarFriendRows = (present: readonly PresentFriend[]) => ({
  rows: present
    .toSorted((a, b) => Number(a.presence === "in-duel") - Number(b.presence === "in-duel"))
    .slice(0, SIDEBAR_ROWS),
  count: present.length,
});
