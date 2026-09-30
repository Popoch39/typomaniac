import { Elysia } from "elysia";

import type { Clock } from "../../lib/clock";
import { type AuthHandler, authentication } from "../auth";
import { BestRunModel } from "./model";
import { readBestRun, sendRun } from "./service";
import type { BestRunStore } from "./store";

export type BestRunModuleConfig = {
  auth: AuthHandler;
  trustProxy: boolean;
  store: BestRunStore;
  clock: Clock;
};

// The signed-in User's Best Runs, one per setting of the solo Run (ADR 0016): the server replays
// each Run sent and keeps it only when it beats the one kept.
export const bestRunModule = ({ auth, trustProxy, store, clock }: BestRunModuleConfig) =>
  new Elysia({ name: "best-run", seed: store })
    .use(authentication(auth, { trustProxy }))
    .post("/runs", ({ user, body }) => sendRun({ store, clock }, user.id, body), {
      auth: true,
      body: BestRunModel.run,
      response: BestRunModel.bestRun,
      detail: {
        summary: "Sends a finished Run: it becomes the Best Run of its setting if its wpm beats it",
        tags: ["Run"],
      },
    })
    .get(
      "/runs/best",
      async ({ user, query }) => ({ bestRun: await readBestRun(store, user.id, query) }),
      {
        auth: true,
        query: BestRunModel.settingQuery,
        response: BestRunModel.bestRunOfSetting,
        detail: {
          summary: "The signed-in User's Best Run of a setting, or null",
          tags: ["Run"],
        },
      },
    );
