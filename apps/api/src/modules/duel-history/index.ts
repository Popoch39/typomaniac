import { Elysia } from "elysia";

import { type AuthHandler, authentication } from "../auth";
import type { LastDuelWritten } from "../duel/service";
import type { DuelStore } from "../duel/store";
import type { Users } from "../user/users";
import { DuelHistoryModel } from "./model";
import { historyActivity, historyWeek, replayedDuel } from "./service";

export type DuelHistoryModuleConfig = {
  auth: AuthHandler;
  trustProxy: boolean;
  store: DuelStore;
  users: Users;
  lastDuelWritten: LastDuelWritten;
};

// The signed-in User's finished Duels: only the two Users of a Duel ever see it. Both routes read
// once the User's last Duel is written: the end of a Duel opens its Replay right away.
export const duelHistoryModule = ({
  auth,
  trustProxy,
  store,
  users,
  lastDuelWritten,
}: DuelHistoryModuleConfig) =>
  new Elysia({ name: "duel-history", seed: store })
    .use(authentication(auth, { trustProxy }))
    .get(
      "/duels",
      async ({ user, query }) => {
        await lastDuelWritten(user.id);

        return historyWeek({ store, users }, user.id, query);
      },
      {
        auth: true,
        query: DuelHistoryModel.weekQuery,
        response: DuelHistoryModel.week,
        detail: {
          summary:
            "The signed-in User's Duels that ended in [from, to), a week at most, the most recent first",
          tags: ["Duel"],
        },
      },
    )
    .get(
      "/duels/activity",
      async ({ user, query: { from, to, timeZone } }) => {
        await lastDuelWritten(user.id);

        return historyActivity({ store }, user.id, { from, to }, timeZone);
      },
      {
        auth: true,
        query: DuelHistoryModel.activityQuery,
        response: DuelHistoryModel.activity,
        detail: {
          summary: "How many Duels the signed-in User finished on each day of their time zone",
          tags: ["Duel"],
        },
      },
    )
    .get(
      "/duels/:duelId",
      async ({ user, params }) => {
        await lastDuelWritten(user.id);

        return replayedDuel({ store, users }, user.id, params.duelId);
      },
      {
        auth: true,
        params: DuelHistoryModel.duelParams,
        response: DuelHistoryModel.duel,
        detail: {
          summary: "One of the signed-in User's finished Duels, whole, to replay it",
          tags: ["Duel"],
        },
      },
    );
