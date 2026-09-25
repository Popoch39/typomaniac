import { t } from "elysia";

import { DuelModel } from "../duel/model";

export const MeModel = {
  me: t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String(),
    image: t.Nullable(t.String()),
    // Null until the User chooses it: the front asks for it.
    handle: t.Nullable(t.String()),
    // Their rank, never their MMR: null until they first join the Queue.
    rank: t.Nullable(DuelModel.rank),
  }),
  // In wpm: the median wpm of the User's last Duels, or the default Pace without any.
  pace: t.Object({ pace: t.Number() }),
};

export type Me = typeof MeModel.me.static;
