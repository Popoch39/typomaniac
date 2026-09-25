import { Elysia } from "elysia";

import { type AuthHandler, authentication } from "../auth";
import type { DuelStore } from "../duel/store";
import type { Users } from "../user/users";
import { LeaderboardModel } from "./model";
import { leaderboardOf } from "./service";

export type LeaderboardModuleConfig = {
  auth: AuthHandler;
  trustProxy: boolean;
  store: DuelStore;
  users: Users;
};

// The Classement: the Users past Placement by Tier, Division then TP, seen by any signed-in User.
export const leaderboardModule = ({ auth, trustProxy, store, users }: LeaderboardModuleConfig) =>
  new Elysia({ name: "leaderboard", seed: store })
    .use(authentication(auth, { trustProxy }))
    .get("/leaderboard", ({ user }) => leaderboardOf({ store, users }, user.id), {
      auth: true,
      response: LeaderboardModel.leaderboard,
      detail: {
        summary: "The Classement: its first Users, and where the signed-in User stands",
        tags: ["Leaderboard"],
      },
    });
