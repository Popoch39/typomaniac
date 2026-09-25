import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/api/client";

const fetchActivity = async () => unwrap(await api.activity.get());

// What the User sees of their Friends: their last Duels and friendships, the newest first.
export type Activity = Awaited<ReturnType<typeof fetchActivity>>[number];

export const activityQueryOptions = queryOptions({
  queryKey: ["activity"],
  queryFn: fetchActivity,
});
