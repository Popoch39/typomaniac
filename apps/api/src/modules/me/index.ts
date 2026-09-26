import { Elysia } from "elysia";

import { type AuthHandler, authentication } from "../auth";
import { type DuelStore, readPace } from "../duel/store";
import { MeModel } from "./model";
import { meOf, setOrnament } from "./service";

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
    // Chooses the Ornament the User wears: 403 when they may not wear it, nothing changed.
    .put(
      "/me/ornament",
      async ({ user, body }) => {
        await setOrnament(duelStore, user.id, body.choice);

        return meOf(duelStore, user);
      },
      {
        auth: true,
        body: MeModel.ornamentInput,
        response: MeModel.me,
        detail: { summary: "Chooses the signed-in User's Ornament", tags: ["Profile"] },
      },
    )
    // The Pace of a solo Run: the one of the User's Duels.
    .get("/me/pace", async ({ user }) => ({ pace: await readPace(duelStore, user.id) }), {
      auth: true,
      response: MeModel.pace,
      detail: {
        summary: "The signed-in User's Pace: the median wpm of their last Duels",
        tags: ["Duel"],
      },
    });
