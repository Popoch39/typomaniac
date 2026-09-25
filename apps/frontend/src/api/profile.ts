import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/api/client";

const fetchProfile = async (handle: string) => unwrap(await api.users({ handle }).profile.get());

// A User's Profile: their Handle of today, their avatar and their Stats.
export type Profile = Awaited<ReturnType<typeof fetchProfile>>;

export type Stats = Profile["stats"];

export const profileQueryOptions = (handle: string) =>
  queryOptions({
    queryKey: ["profile", handle],
    queryFn: () => fetchProfile(handle),
  });
