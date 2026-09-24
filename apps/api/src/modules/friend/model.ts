import { t } from "elysia";

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

// Another User as a Friend or a Friend request shows them: never their name nor their email.
const friendProfile = t.Object({
  id: t.String(),
  handle: t.String(),
  image: t.Nullable(t.String()),
});

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

export type Relation = (typeof RELATIONS)[number];

export type FriendRefusal = (typeof FRIEND_REFUSALS)[number];

export type FriendProfile = typeof friendProfile.static;

export type FriendRequests = typeof FriendModel.friendRequests.static;
