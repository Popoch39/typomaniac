import { Type } from "@sinclair/typebox";
import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/api/client";

// The page after or before a row's cursor (opaque, written by the API), or the reader's own page:
// the first one without any.
export const LeaderboardSearchSchema = Type.Object({
  after: Type.Optional(Type.String({ maxLength: 300 })),
  before: Type.Optional(Type.String({ maxLength: 300 })),
  at: Type.Optional(Type.Literal("me")),
});

// Which page of the Leaderboard the URL shows.
export type LeaderboardSearch = typeof LeaderboardSearchSchema.static;

// The one page a search names: the first one when it names more than one.
export const onePageOf = ({ after, before, at }: LeaderboardSearch): LeaderboardSearch => {
  if ([after, before, at].filter((given) => given !== undefined).length !== 1) {
    return {};
  }

  if (after !== undefined) {
    return { after };
  }

  return before === undefined ? { at } : { before };
};

const fetchLeaderboard = async (search: LeaderboardSearch) =>
  unwrap(await api.leaderboard.get({ query: search }));

// A page of the Leaderboard, and where the signed-in User stands in it.
export type Leaderboard = Awaited<ReturnType<typeof fetchLeaderboard>>;

export type LeaderboardEntry = Leaderboard["entries"][number];

// Every page of the Leaderboard: what a Ranked Duel that ends invalidates.
export const LEADERBOARD_QUERY_KEY = ["leaderboard"] as const;

export const leaderboardQueryOptions = (search: LeaderboardSearch) =>
  queryOptions({
    queryKey: [...LEADERBOARD_QUERY_KEY, search],
    queryFn: () => fetchLeaderboard(search),
  });
