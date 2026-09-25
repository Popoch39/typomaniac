import { t } from "elysia";

import { DuelModel } from "../duel/model";

// How many Users of the Classement the page shows, from the first.
export const LEADERBOARD_LIMIT = 100;

// A User of the Classement: their place, their Handle of today, their avatar and their rank, never
// their MMR, their name nor their email.
const entry = t.Object({
  position: t.Integer(),
  handle: t.String(),
  image: t.Nullable(t.String()),
  rank: DuelModel.standing,
});

export const LeaderboardModel = {
  // The first Users of the Classement, and the one who asks wherever they stand: null in
  // Placement, without a Rating or without a Handle.
  leaderboard: t.Object({ entries: t.Array(entry), me: t.Nullable(entry) }),
};

export type Leaderboard = typeof LeaderboardModel.leaderboard.static;

export type LeaderboardEntry = typeof entry.static;
