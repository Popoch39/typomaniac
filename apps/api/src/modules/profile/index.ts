import { Elysia } from "elysia";

import { type AuthHandler, authentication } from "../auth";
import type { DuelStore } from "../duel/store";
import type { Users } from "../user/users";
import { ProfileModel } from "./model";
import { profileOfHandle } from "./service";

export type ProfileModuleConfig = {
  auth: AuthHandler;
  trustProxy: boolean;
  store: DuelStore;
  users: Users;
};

// A User's Profile, found by their Handle: any signed-in User may see it.
export const profileModule = ({ auth, trustProxy, store, users }: ProfileModuleConfig) =>
  new Elysia({ name: "profile", seed: store })
    .use(authentication(auth, { trustProxy }))
    .get(
      "/users/:handle/profile",
      ({ params }) => profileOfHandle({ store, users }, params.handle),
      {
        auth: true,
        params: ProfileModel.params,
        response: ProfileModel.profile,
        detail: {
          summary: "A User's Profile, by their Handle: their avatar and their Stats",
          tags: ["Profile"],
        },
      },
    );
