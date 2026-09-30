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

// The Leaderboard: the Users past Placement by Tier, Division then TP, seen by any signed-in User.
export const leaderboardModule = ({ auth, trustProxy, store, users }: LeaderboardModuleConfig) =>
  new Elysia({ name: "leaderboard", seed: store })
    .use(authentication(auth, { trustProxy }))
    .get("/leaderboard", ({ user, query }) => leaderboardOf({ store, users }, user.id, query), {
      auth: true,
      query: LeaderboardModel.query,
      response: LeaderboardModel.leaderboard,
      detail: {
        summary:
          "A page of the Leaderboard, 25 Places, and where the signed-in User stands: the first page, the one after or before a cursor, or the User's own (at=me)",
        tags: ["Leaderboard"],
      },
    });
