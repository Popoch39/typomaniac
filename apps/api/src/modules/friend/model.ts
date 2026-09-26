import { t } from "elysia";

import { PublicUser } from "../user/public-user";

// Where a User stands with another: Friends, a Friend request one way or the other, or nothing.
export const RELATIONS = ["none", "friend", "request-sent", "request-received"] as const;

// Why a Friend action is refused, sent in the error's details: the front says what went wrong.
export const FRIEND_REFUSALS = [
  "self",
  "user-not-found",
  "already-friends",
  "already-requested",
  "request-limit",
  "friend-limit",
  "their-friend-limit",
  "request-not-found",
  "not-friends",
] as const;

// Another User as a Friend or a Friend request shows them, with the Ornament they wear around
// their avatar: never their name nor their email.
const friendProfile = PublicUser;

const otherUser = t.Object({ userId: t.String() });

const relation = t.UnionEnum(RELATIONS);

export const FriendModel = {
  relation,
  // Where the User stands with the other once the action is done.
  relationWith: t.Object({ relation }),
  friends: t.Array(friendProfile),
  // Newest first, both ways.
  friendRequests: t.Object({
    received: t.Array(friendProfile),
    sent: t.Array(friendProfile),
  }),
  // The other User of the action, in the body or the path.
  otherUser,
};

// What a User shows their Friends of their availability: typomaniac open (the Queue counts), in a
// Duel (Countdown included), or no tab open at all.
export const PRESENCES = ["online", "in-duel", "offline"] as const;

const presence = t.UnionEnum(PRESENCES);

const friendId = t.String();

// How many Friend requests wait for the User's answer, after the change: the badge shows it.
const requestsReceived = t.Integer({ minimum: 0 });

// What the real-time connection tells a User of their Friends, on the Duel socket (ADR 0007): the
// front reads its lists again over HTTP, these only say what changed.
const friendMessage = t.Union([
  // On connection: each Friend's Presence, and the Friend requests waiting.
  t.Object({
    type: t.Literal("friends-snapshot"),
    presences: t.Array(t.Object({ userId: friendId, presence })),
    requestsReceived,
  }),
  // A Friend's Presence changed. Only their Friends are told.
  t.Object({ type: t.Literal("presence"), userId: friendId, presence }),
  t.Object({ type: t.Literal("friend-request-received"), userId: friendId, requestsReceived }),
  // A request received is gone: cancelled by its sender, or declined from another tab.
  t.Object({ type: t.Literal("friend-request-removed"), userId: friendId, requestsReceived }),
  // Friends now, a request accepted either way: any request between the two is gone.
  t.Object({ type: t.Literal("friend-added"), userId: friendId, presence, requestsReceived }),
  // Removed by either of the two: their Presence is not told anymore.
  t.Object({ type: t.Literal("friend-removed"), userId: friendId }),
]);

export const FriendLiveModel = { friendMessage };

export type Presence = (typeof PRESENCES)[number];

export type FriendMessage = typeof friendMessage.static;

export type Relation = (typeof RELATIONS)[number];

export type FriendRefusal = (typeof FRIEND_REFUSALS)[number];

export type FriendProfile = typeof friendProfile.static;

export type FriendRequests = typeof FriendModel.friendRequests.static;
