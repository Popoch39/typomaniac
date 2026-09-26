import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { meQueryOptions } from "@/api/me";
import { onServerMessage } from "@/stores/connection-store";

// Keeps the rank of the User chip up to date without a reload: a Ranked Duel that ends, won, lost
// or drawn, reads the User again. A Challenge or a Duel not written (`ranked` null) changes nothing.
export const LiveRank = () => {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      onServerMessage((message) => {
        if (message.type === "duel-ended" && message.ranked !== null) {
          void queryClient.invalidateQueries({ queryKey: meQueryOptions.queryKey });
        }
      }),
    [queryClient],
  );

  return null;
};
