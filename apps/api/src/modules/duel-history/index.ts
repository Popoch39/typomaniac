import { Elysia } from "elysia";

import { type AuthHandler, authentication } from "../auth";
import type { DuelStore } from "../duel/store";
import type { Users } from "../user/users";
import { DuelHistoryModel } from "./model";
import { duelHistory } from "./service";

export type DuelHistoryModuleConfig = {
  auth: AuthHandler;
  trustProxy: boolean;
  store: DuelStore;
  users: Users;
};

// The signed-in User's finished Duels: only the two Users of a Duel ever see it.
export const duelHistoryModule = ({ auth, trustProxy, store, users }: DuelHistoryModuleConfig) =>
  new Elysia({ name: "duel-history", seed: store })
    .use(authentication(auth, { trustProxy }))
    .get("/duels", ({ user, query }) => duelHistory({ store, users }, user.id, query.before), {
      auth: true,
      query: DuelHistoryModel.query,
      response: DuelHistoryModel.page,
      detail: {
        summary: "The signed-in User's Duel history, the most recent first, 20 per page",
        tags: ["Duel"],
      },
    });
