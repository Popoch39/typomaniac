import { t } from "elysia";

import { WornOrnament } from "../duel/tier";

// Another User as the lists show them (Friends, Friend requests, search, Activity): their Handle,
// their avatar and the Ornament they wear around it, never their name nor their email. Apart from
// model.ts, which imports the Friends' model: those models build on it without a cycle.
export const PublicUser = t.Object({
  id: t.String(),
  handle: t.String(),
  image: t.Nullable(t.String()),
  ornament: WornOrnament,
});

export type PublicUser = typeof PublicUser.static;
