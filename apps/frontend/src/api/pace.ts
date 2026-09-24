import { queryOptions } from "@tanstack/react-query";
import { defaultPace } from "typing-engine";

import { api, unwrap } from "@/api/client";
import type { Me } from "@/api/me";

// The Pace of a solo Run, in wpm: the median wpm of the User's last Duels, the default Pace for a
// Visitor. It only moves at the end of a Duel, which outlasts `staleTime`: a Run after one reads it
// again.
export const paceQueryOptions = (me: Me | null) =>
  queryOptions({
    queryKey: ["pace", me?.id ?? null],
    queryFn: async () => (me === null ? defaultPace : unwrap(await api.me.pace.get()).pace),
    staleTime: 30_000,
  });
