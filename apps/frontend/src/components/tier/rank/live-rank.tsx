import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { leaderboardQueryOptions } from "@/api/leaderboard";
import { meQueryOptions } from "@/api/me";
import { onServerMessage } from "@/stores/connection-store";

// Keeps the rank up to date without a reload: a Ranked Duel that ends, won, lost or drawn, reads
// the User again (the User card) and the Classement, where the User's place moved. A Challenge or
// a Duel not written (`ranked` null) changes nothing.
export const LiveRank = () => {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      onServerMessage((message) => {
        if (message.type === "duel-ended" && message.ranked !== null) {
          void queryClient.invalidateQueries({ queryKey: meQueryOptions.queryKey });
          void queryClient.invalidateQueries({ queryKey: leaderboardQueryOptions.queryKey });
        }
      }),
    [queryClient],
  );

  return null;
};
