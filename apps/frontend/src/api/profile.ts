import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/api/client";

// How many of their last Duels the Progression shows, among the server's windows: its default, 50,
// or all of them.
export const PROGRESSION_WINDOWS = ["50", "all"] as const;

export type ProgressionWindow = (typeof PROGRESSION_WINDOWS)[number];

export const DEFAULT_PROGRESSION_WINDOW: ProgressionWindow = "50";

const fetchProfile = async (handle: string, span: ProgressionWindow) =>
  unwrap(await api.users({ handle }).profile.get({ query: { window: span } }));

// A User's Profile: their Handle of today, their avatar and their Stats.
export type Profile = Awaited<ReturnType<typeof fetchProfile>>;

export type Stats = Profile["stats"];

export type ProgressionPoint = Stats["progression"][number];

// Every User's Profile: the prefix of all their entries.
export const PROFILE_QUERY_KEY = ["profile"] as const;

// Every window of one User's Profile: the prefix of their entries. A Handle has no case.
export const profileQueryKey = (handle: string) =>
  [...PROFILE_QUERY_KEY, handle.toLowerCase()] as const;

// The window changes the Progression only: the rest of the Stats reads the default one. A Handle
// has no case: `/u/Ada` and `/u/ada` share one entry.
export const profileQueryOptions = (
  handle: string,
  span: ProgressionWindow = DEFAULT_PROGRESSION_WINDOW,
) => {
  const lower = handle.toLowerCase();

  return queryOptions({
    queryKey: [...profileQueryKey(lower), span],
    queryFn: () => fetchProfile(lower, span),
  });
};
