import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { LEADERBOARD_QUERY_KEY } from "@/api/leaderboard";
import { meQueryOptions } from "@/api/me";
import { PROFILE_QUERY_KEY } from "@/api/profile";
import { onServerMessage } from "@/stores/connection-store";

// Keeps the rank and the Stats up to date without a reload: a Ranked Duel that ends, won, lost or
// drawn, reads the User again (the User card) and every page of the Leaderboard, where the User's
// Place moved. A Challenge (`ranked` null) moves no rank. Any Duel that ends, a Challenge too,
// reads the Profiles again: the Stats of both players moved, their Records maybe, and the User's
// must never contradict the end screen. The end comes before the Duel is written: the API answers
// these reads once it is.
export const LiveRank = () => {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      onServerMessage((message) => {
        if (message.type !== "duel-ended") {
          return;
        }

        void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });

        if (message.ranked !== null) {
          void queryClient.invalidateQueries({ queryKey: meQueryOptions.queryKey });
          void queryClient.invalidateQueries({ queryKey: LEADERBOARD_QUERY_KEY });
        }
      }),
    [queryClient],
  );

  return null;
};
