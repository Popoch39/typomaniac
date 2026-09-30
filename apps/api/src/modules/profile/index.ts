import { Elysia } from "elysia";

import { type AuthHandler, authentication } from "../auth";
import type { LastDuelWritten } from "../duel/service";
import type { DuelStore } from "../duel/store";
import type { Users } from "../user/users";
import { ProfileModel } from "./model";
import { profileOfHandle } from "./service";

export type ProfileModuleConfig = {
  auth: AuthHandler;
  trustProxy: boolean;
  store: DuelStore;
  users: Users;
  lastDuelWritten: LastDuelWritten;
};

// A User's Profile, found by their Handle: any signed-in User may see it. The service waits for
// the write of the shown User's last Duel, known once their Handle is.
export const profileModule = ({
  auth,
  trustProxy,
  store,
  users,
  lastDuelWritten,
}: ProfileModuleConfig) =>
  new Elysia({ name: "profile", seed: store })
    .use(authentication(auth, { trustProxy }))
    .get(
      "/users/:handle/profile",
      ({ params, query }) =>
        profileOfHandle({ store, users, lastDuelWritten }, params.handle, query.window ?? "50"),
      {
        auth: true,
        params: ProfileModel.params,
        query: ProfileModel.query,
        response: ProfileModel.profile,
        detail: {
          summary: "A User's Profile, by their Handle: their avatar and their Stats",
          tags: ["Profile"],
        },
      },
    );
