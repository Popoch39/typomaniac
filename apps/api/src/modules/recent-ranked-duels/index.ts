import { Elysia } from "elysia";

import { type AuthHandler, authentication } from "../auth";
import type { LastDuelWritten } from "../duel/service";
import type { DuelStore } from "../duel/store";
import type { Users } from "../user/users";
import { RecentRankedDuelsModel } from "./model";
import { recentRankedDuels } from "./service";

export type RecentRankedDuelsModuleConfig = {
  auth: AuthHandler;
  trustProxy: boolean;
  store: DuelStore;
  users: Users;
  lastDuelWritten: LastDuelWritten;
};

// The last Ranked Duels of the signed-in User's Tier, for Jouer's Ranked card. Read once the
// User's last Duel is written: back on Jouer from a Duel end, their own Duel may be listed.
export const recentRankedDuelsModule = ({
  auth,
  trustProxy,
  store,
  users,
  lastDuelWritten,
}: RecentRankedDuelsModuleConfig) =>
  new Elysia({ name: "recent-ranked-duels", seed: store })
    .use(authentication(auth, { trustProxy }))
    .get(
      "/ranked/recent-duels",
      async ({ user }) => {
        await lastDuelWritten(user.id);

        return recentRankedDuels({ store, users }, user.id);
      },
      {
        auth: true,
        response: RecentRankedDuelsModel.recentDuels,
        detail: {
          summary:
            "The last 3 Ranked Duels won by a User of the signed-in User's Tier, every Tier in Placement",
          tags: ["Duel"],
        },
      },
    );
