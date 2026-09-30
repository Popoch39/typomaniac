import type { Activity } from "@/api/activity";
import type { PresentFriend } from "@/components/friends/online-friends";

// How many Friends in a Duel lead the block, then how many of their Duels follow.
const IN_DUEL_ROWS = 2;

const DUEL_ROWS = 3;

export type DuelActivity = Extract<Activity, { type: "duel" }>;

// A row of « Chez tes Friends »: a Friend in a Duel right now, or one of their last Duels.
export type FriendsLiveRow =
  | { kind: "in-duel"; friend: PresentFriend }
  | { kind: "duel"; activity: DuelActivity };

// The Friends in a Duel first, then the last Duels of the Friends, the newest first: the
// friendships and the arrivals are the Activity page's alone.
export const friendsLiveRows = (
  activities: readonly Activity[],
  present: readonly PresentFriend[],
): FriendsLiveRow[] => [
  ...present
    .flatMap((friend): FriendsLiveRow[] =>
      friend.presence === "in-duel" ? [{ kind: "in-duel", friend }] : [],
    )
    .slice(0, IN_DUEL_ROWS),
  ...activities
    .flatMap((activity): FriendsLiveRow[] =>
      activity.type === "duel" ? [{ kind: "duel", activity }] : [],
    )
    .slice(0, DUEL_ROWS),
];
