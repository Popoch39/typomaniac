import { Elysia } from "elysia";

import { type AuthHandler, authentication } from "../auth";
import { type DuelStore, readPace } from "../duel/store";
import { MeModel } from "./model";
import { meOf } from "./service";

export type MeModuleConfig = { auth: AuthHandler; trustProxy: boolean; duelStore: DuelStore };

// The signed-in User: /api/me and what hangs off it.
export const meModule = ({ auth, trustProxy, duelStore }: MeModuleConfig) =>
  new Elysia({ name: "me", seed: duelStore })
    .use(authentication(auth, { trustProxy }))
    .get("/me", ({ user }) => meOf(duelStore, user), {
      auth: true,
      response: MeModel.me,
      detail: { summary: "The signed-in User", tags: ["Auth"] },
    })
    // The Pace of a solo Run: the one of the User's Duels.
    .get("/me/pace", async ({ user }) => ({ pace: await readPace(duelStore, user.id) }), {
      auth: true,
      response: MeModel.pace,
      detail: {
        summary: "The signed-in User's Pace: the median wpm of their last Duels",
        tags: ["Duel"],
      },
    });
