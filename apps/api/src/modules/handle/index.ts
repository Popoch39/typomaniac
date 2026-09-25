import { Elysia } from "elysia";

import { type AuthHandler, authentication, readSession } from "../auth";
import type { DuelStore } from "../duel/store";
import { MeModel } from "../me/model";
import { meOf } from "../me/service";
import type { Users } from "../user/users";
import { HandleModel } from "./model";
import { checkHandle, setHandle } from "./service";

export type HandleModuleConfig = {
  auth: AuthHandler;
  trustProxy: boolean;
  users: Users;
  duelStore: DuelStore;
};

export const handleModule = ({ auth, trustProxy, users, duelStore }: HandleModuleConfig) =>
  new Elysia({ name: "handle", seed: users })
    .use(authentication(auth, { trustProxy }))
    // Sets or changes the User's Handle: 422 with the reason in `details` when invalid, 409 when
    // another User holds it. The Session is cached again with the Handle.
    .put(
      "/me/handle",
      async ({ user, body, request, set }) => {
        await setHandle(users, user.id, body.handle);

        return meOf(duelStore, (await readSession(auth, request, set, { fresh: true })).user);
      },
      {
        auth: true,
        body: HandleModel.input,
        response: MeModel.me,
        detail: { summary: "Sets the signed-in User's Handle", tags: ["Handle"] },
      },
    )
    // For the live check while the User types: valid, and free or already theirs.
    .get("/handles/availability", ({ user, query }) => checkHandle(users, user.id, query.handle), {
      auth: true,
      query: HandleModel.input,
      response: HandleModel.availability,
      detail: { summary: "Whether the signed-in User may take a Handle", tags: ["Handle"] },
    });
