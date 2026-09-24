import { ApiError, type ErrorCode } from "../../lib/errors";
import type { Users } from "../user/users";
import type { FriendEvents } from "./live";
import type { FriendRefusal, FriendRequests, Relation } from "./model";
import type { FriendStore } from "./store";

export const MAX_FRIENDS = 200;

// Sent and still waiting: past it, the User waits for answers or cancels some.
export const MAX_SENT_REQUESTS = 50;

// `events`: told once written, for the Users concerned to be told live (FriendsLive).
export type FriendDeps = { store: FriendStore; users: Users; events: FriendEvents };

// The User acting, as the Session knows them.
export type Actor = { id: string; handle: string | null };

const REFUSALS: Record<FriendRefusal, { code: ErrorCode; message: string }> = {
  self: { code: "VALIDATION_FAILED", message: "You cannot be your own Friend" },
  "user-not-found": { code: "NOT_FOUND", message: "No such User" },
  "already-friends": { code: "CONFLICT", message: "You are already Friends" },
  "already-requested": { code: "CONFLICT", message: "A Friend request already waits" },
  "request-limit": {
    code: "CONFLICT",
    message: `At most ${MAX_SENT_REQUESTS} Friend requests may wait for an answer`,
  },
  "friend-limit": { code: "CONFLICT", message: `At most ${MAX_FRIENDS} Friends` },
  "their-friend-limit": {
    code: "CONFLICT",
    message: `This User already has ${MAX_FRIENDS} Friends`,
  },
  "request-not-found": { code: "NOT_FOUND", message: "No such Friend request" },
  "not-friends": { code: "NOT_FOUND", message: "You are not Friends" },
};

// The refusal as an API error, the rule it broke in its details, like a refused Handle.
const refused = (reason: FriendRefusal) => {
  const { code, message } = REFUSALS[reason];

  return new ApiError(code, message, [{ path: "/userId", message: reason }]);
};

// The Friends go by their Handle: a User without one has none yet.
const requireHandle = (actor: Actor) => {
  if (actor.handle === null) {
    throw new ApiError("FORBIDDEN", "Choose a Handle to have Friends");
  }
};

// The profiles of `userIds` in that order, those without a Handle left out.
const profilesInOrder = async (users: Users, userIds: readonly string[]) => {
  const byId = new Map((await users.profilesOf(userIds)).map((profile) => [profile.id, profile]));

  return userIds.flatMap((id) => byId.get(id) ?? []);
};

// Accepts the request `senderId` sent to `recipientId`, `recipientId` acting: both under the limit,
// then the request turned into a friendship in one transaction. Two accepts at once may pass the
// limit by one: a count, not a constraint.
const accept = async (
  { store, events }: Pick<FriendDeps, "store" | "events">,
  recipientId: string,
  senderId: string,
): Promise<Relation> => {
  const [recipientFriends, senderFriends] = await Promise.all([
    store.countFriends(recipientId),
    store.countFriends(senderId),
  ]);

  if (recipientFriends >= MAX_FRIENDS) {
    throw refused("friend-limit");
  }

  if (senderFriends >= MAX_FRIENDS) {
    throw refused("their-friend-limit");
  }

  if (!(await store.acceptRequest(senderId, recipientId))) {
    throw refused("request-not-found");
  }

  events.friendsAdded(recipientId, senderId);

  return "friend";
};

// Where `userId` stands with each of `otherIds`, for the search.
export const relationsWith = async (
  store: FriendStore,
  userId: string,
  otherIds: readonly string[],
) => {
  const relations = await store.relationsWith(userId, otherIds);

  return (otherId: string): Relation => relations.get(otherId) ?? "none";
};

const relationOf = async (store: FriendStore, userId: string, otherId: string) =>
  (await relationsWith(store, userId, [otherId]))(otherId);

export const listFriends = async ({ store, users }: FriendDeps, actor: Actor) => {
  requireHandle(actor);

  const friends = await users.profilesOf(await store.friendIds(actor.id));

  return friends.toSorted((a, b) => (a.handle < b.handle ? -1 : 1));
};

export const listFriendRequests = async (
  { store, users }: FriendDeps,
  actor: Actor,
): Promise<FriendRequests> => {
  requireHandle(actor);

  const { received, sent } = await store.requestsOf(actor.id);

  const [receivedProfiles, sentProfiles] = await Promise.all([
    profilesInOrder(users, received),
    profilesInOrder(users, sent),
  ]);

  return { received: receivedProfiles, sent: sentProfiles };
};

// A Friend request to `recipientId`, who must have a Handle. One they had sent the other way makes
// them Friends at once.
export const sendFriendRequest = async (
  { store, users, events }: FriendDeps,
  actor: Actor,
  recipientId: string,
): Promise<Relation> => {
  requireHandle(actor);

  if (recipientId === actor.id) {
    throw refused("self");
  }

  if ((await users.profileOf(recipientId))?.handle == null) {
    throw refused("user-not-found");
  }

  const relation = await relationOf(store, actor.id, recipientId);

  if (relation === "friend") {
    throw refused("already-friends");
  }

  if (relation === "request-sent") {
    throw refused("already-requested");
  }

  if (relation === "request-received") {
    return accept({ store, events }, actor.id, recipientId);
  }

  const [friends, sent] = await Promise.all([
    store.countFriends(actor.id),
    store.countSentRequests(actor.id),
  ]);

  if (friends >= MAX_FRIENDS) {
    throw refused("friend-limit");
  }

  if (sent >= MAX_SENT_REQUESTS) {
    throw refused("request-limit");
  }

  const added = await store.addRequest(actor.id, recipientId);

  if (added === "exists") {
    throw refused("already-requested");
  }

  // Theirs landed in the meantime: crossed all the same.
  if (added === "crossed") {
    return accept({ store, events }, actor.id, recipientId);
  }

  events.requestSent(actor.id, recipientId);

  return "request-sent";
};

export const acceptFriendRequest = async (
  { store, events }: FriendDeps,
  actor: Actor,
  senderId: string,
): Promise<Relation> => {
  requireHandle(actor);

  if ((await relationOf(store, actor.id, senderId)) !== "request-received") {
    throw refused("request-not-found");
  }

  return accept({ store, events }, actor.id, senderId);
};

// Silent: the sender is not told, and may ask again.
export const declineFriendRequest = async (
  { store, events }: FriendDeps,
  actor: Actor,
  senderId: string,
): Promise<Relation> => {
  requireHandle(actor);

  if (!(await store.deleteRequest(senderId, actor.id))) {
    throw refused("request-not-found");
  }

  events.requestRemoved(senderId, actor.id);

  return "none";
};

export const cancelFriendRequest = async (
  { store, events }: FriendDeps,
  actor: Actor,
  recipientId: string,
): Promise<Relation> => {
  requireHandle(actor);

  if (!(await store.deleteRequest(actor.id, recipientId))) {
    throw refused("request-not-found");
  }

  events.requestRemoved(actor.id, recipientId);

  return "none";
};

// At any time, without the other's say.
export const removeFriend = async (
  { store, events }: FriendDeps,
  actor: Actor,
  friendId: string,
): Promise<Relation> => {
  requireHandle(actor);

  if (!(await store.deleteFriendship(actor.id, friendId))) {
    throw refused("not-friends");
  }

  events.friendsRemoved(actor.id, friendId);

  return "none";
};
