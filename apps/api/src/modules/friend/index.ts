import { Elysia } from "elysia";

import { keyedRateLimit, type RateLimit } from "../../plugins/rate-limit";
import { type AuthHandler, authentication } from "../auth";
import type { DuelStore } from "../duel/store";
import type { Users } from "../user/users";
import type { FriendEvents } from "./live";
import { FriendModel } from "./model";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  listFriendRequests,
  listFriends,
  removeFriend,
  sendFriendRequest,
} from "./service";
import type { FriendStore } from "./store";

export type FriendModuleConfig = {
  auth: AuthHandler;
  trustProxy: boolean;
  users: Users;
  store: FriendStore;
  // Where the Ornament of each User listed is read.
  duelStore: DuelStore;
  // Told after each write, for the Users concerned to be told live.
  events: FriendEvents;
  // Per User, on sending only: nobody sprays Friend requests at everyone.
  sendRateLimit: RateLimit;
};

const actorOf = (user: { id: string; handle?: string | null }) => ({
  id: user.id,
  handle: user.handle ?? null,
});

// Each refusal is a 4xx whose details carry the rule broken (FRIEND_REFUSALS, path `/userId`). The
// actions answer where the User then stands with the other.
export const friendModule = ({
  auth,
  trustProxy,
  users,
  store,
  duelStore,
  events,
  sendRateLimit,
}: FriendModuleConfig) => {
  const deps = { store, users, duelStore, events };

  // Throws the 429 once a User is over their Friend requests.
  const limitSends = keyedRateLimit(sendRateLimit);

  return new Elysia({ name: "friend", seed: store })
    .use(authentication(auth, { trustProxy }))
    .get("/friends", ({ user }) => listFriends(deps, actorOf(user)), {
      auth: true,
      response: FriendModel.friends,
      detail: { summary: "The signed-in User's Friends, by Handle", tags: ["Friends"] },
    })
    .delete(
      "/friends/:userId",
      async ({ user, params }) => ({
        relation: await removeFriend(deps, actorOf(user), params.userId),
      }),
      {
        auth: true,
        params: FriendModel.otherUser,
        response: FriendModel.relationWith,
        detail: { summary: "Removes a Friend, without their say", tags: ["Friends"] },
      },
    )
    .get("/friend-requests", ({ user }) => listFriendRequests(deps, actorOf(user)), {
      auth: true,
      response: FriendModel.friendRequests,
      detail: {
        summary: "The Friend requests the signed-in User received and sent, newest first",
        tags: ["Friends"],
      },
    })
    .post(
      "/friend-requests",
      async ({ user, body, set }) => {
        limitSends(user.id, set);

        return { relation: await sendFriendRequest(deps, actorOf(user), body.userId) };
      },
      {
        auth: true,
        body: FriendModel.otherUser,
        response: FriendModel.relationWith,
        detail: {
          summary: "Sends a Friend request; one crossing it makes both Users Friends",
          tags: ["Friends"],
        },
      },
    )
    .delete(
      "/friend-requests/sent/:userId",
      async ({ user, params }) => ({
        relation: await cancelFriendRequest(deps, actorOf(user), params.userId),
      }),
      {
        auth: true,
        params: FriendModel.otherUser,
        response: FriendModel.relationWith,
        detail: { summary: "Cancels a Friend request sent", tags: ["Friends"] },
      },
    )
    .post(
      "/friend-requests/received/:userId/accept",
      async ({ user, params }) => ({
        relation: await acceptFriendRequest(deps, actorOf(user), params.userId),
      }),
      {
        auth: true,
        params: FriendModel.otherUser,
        response: FriendModel.relationWith,
        detail: { summary: "Accepts a Friend request received", tags: ["Friends"] },
      },
    )
    .delete(
      "/friend-requests/received/:userId",
      async ({ user, params }) => ({
        relation: await declineFriendRequest(deps, actorOf(user), params.userId),
      }),
      {
        auth: true,
        params: FriendModel.otherUser,
        response: FriendModel.relationWith,
        detail: {
          summary: "Declines a Friend request received, without telling the sender",
          tags: ["Friends"],
        },
      },
    );
};
