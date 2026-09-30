import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/api/client";

const fetchRecentRankedDuels = async () => unwrap(await api.ranked["recent-duels"].get());

// The last Ranked Duels won in the User's Tier (every Tier in Placement), and that Tier: null for
// every Tier. The most recent first.
export type RecentRankedDuels = Awaited<ReturnType<typeof fetchRecentRankedDuels>>;

export type RecentRankedDuel = RecentRankedDuels["duels"][number];

// Read again each time Jouer shows, however fresh: the list stays recent.
export const recentRankedDuelsQueryOptions = queryOptions({
  queryKey: ["recent-ranked-duels"],
  queryFn: fetchRecentRankedDuels,
  refetchOnMount: "always",
});
