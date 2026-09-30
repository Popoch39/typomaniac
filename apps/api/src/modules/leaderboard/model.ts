import { t } from "elysia";

import { DuelModel } from "../duel/model";
import { WornOrnament } from "../duel/tier";

// How many Places a page of the Leaderboard holds: its pages start at 1, 26, 51…
export const LEADERBOARD_PAGE = 25;

// A row of the Leaderboard, opaque (its key in base64url): a page starts right after or right
// before it.
const cursor = t.String({ pattern: "^[A-Za-z0-9_-]+$", maxLength: 300 });

// A User of the Leaderboard: their Place, their Handle of today, their avatar with the Ornament
// they wear and their rank, never their MMR, their name nor their email.
const entry = t.Object({
  place: t.Integer(),
  handle: t.String(),
  image: t.Nullable(t.String()),
  ornament: WornOrnament,
  rank: DuelModel.standing,
});

export const LeaderboardModel = {
  // The first page without any, the page after or before a cursor, or the reader's own page.
  query: t.Object({
    after: t.Optional(cursor),
    before: t.Optional(cursor),
    at: t.Optional(t.Literal("me")),
  }),
  // A page of the Leaderboard and the one who asks wherever they stand: null in Placement, without
  // a Rating or without a Handle. `firstPlace` and `lastPlace` are the Places of the page's first
  // and last rows (those without a Handle count: 0 below `firstPlace` on an empty page), `total`
  // how many Users the Leaderboard holds; `previous` and `next` lead to the pages around it, null
  // at either end.
  leaderboard: t.Object({
    entries: t.Array(entry),
    me: t.Nullable(entry),
    firstPlace: t.Integer(),
    lastPlace: t.Integer(),
    total: t.Integer(),
    previous: t.Nullable(cursor),
    next: t.Nullable(cursor),
  }),
};

export type LeaderboardQuery = typeof LeaderboardModel.query.static;

export type Leaderboard = typeof LeaderboardModel.leaderboard.static;

export type LeaderboardEntry = typeof entry.static;
