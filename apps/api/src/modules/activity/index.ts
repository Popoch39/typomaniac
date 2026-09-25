import { Elysia } from "elysia";

import { type AuthHandler, authentication } from "../auth";
import type { DuelStore } from "../duel/store";
import type { FriendStore } from "../friend/store";
import type { Users } from "../user/users";
import { ActivityModel } from "./model";
import { activityOf } from "./service";

export type ActivityModuleConfig = {
  auth: AuthHandler;
  trustProxy: boolean;
  duelStore: DuelStore;
  friendStore: FriendStore;
  users: Users;
};

// The Activity of the signed-in User's Friends: read from the Duels and the friendships.
export const activityModule = ({ auth, trustProxy, ...deps }: ActivityModuleConfig) =>
  new Elysia({ name: "activity", seed: deps.duelStore })
    .use(authentication(auth, { trustProxy }))
    .get("/activity", ({ user }) => activityOf(deps, user.id), {
      auth: true,
      response: ActivityModel.activities,
      detail: {
        summary: "The last Duels and friendships of the signed-in User's Friends, newest first",
        tags: ["Friends"],
      },
    });
