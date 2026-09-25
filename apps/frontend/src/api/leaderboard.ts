import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/api/client";

const fetchLeaderboard = async () => unwrap(await api.leaderboard.get());

// The Classement: its first Users, and where the signed-in User stands in it.
export type Leaderboard = Awaited<ReturnType<typeof fetchLeaderboard>>;

export type LeaderboardEntry = Leaderboard["entries"][number];

export const leaderboardQueryOptions = queryOptions({
  queryKey: ["leaderboard"],
  queryFn: fetchLeaderboard,
});
