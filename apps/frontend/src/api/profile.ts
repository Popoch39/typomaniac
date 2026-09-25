import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/api/client";

// How many of their last Duels the Progression shows: the server's default is 50.
export const PROGRESSION_WINDOWS = ["50", "200", "all"] as const;

export type ProgressionWindow = (typeof PROGRESSION_WINDOWS)[number];

export const DEFAULT_PROGRESSION_WINDOW: ProgressionWindow = "50";

const fetchProfile = async (handle: string, span: ProgressionWindow) =>
  unwrap(await api.users({ handle }).profile.get({ query: { window: span } }));

// A User's Profile: their Handle of today, their avatar and their Stats.
export type Profile = Awaited<ReturnType<typeof fetchProfile>>;

export type Stats = Profile["stats"];

export type ProgressionPoint = Stats["progression"][number];

// The window changes the Progression only: the tiles and the record read the default one.
export const profileQueryOptions = (
  handle: string,
  span: ProgressionWindow = DEFAULT_PROGRESSION_WINDOW,
) =>
  queryOptions({
    queryKey: ["profile", handle, span],
    queryFn: () => fetchProfile(handle, span),
  });
