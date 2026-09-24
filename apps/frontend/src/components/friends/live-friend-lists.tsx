import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { FRIEND_QUERY_KEYS } from "@/api/friends";
import { changesFriendLists, onServerMessage } from "@/stores/connection-store";

// Keeps the Friend lists and the search's relations up to date without a reload: whenever the
// real-time connection says they changed, on any page, they are read again.
export const LiveFriendLists = () => {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      onServerMessage((message) => {
        if (changesFriendLists(message)) {
          for (const queryKey of FRIEND_QUERY_KEYS) {
            void queryClient.invalidateQueries({ queryKey });
          }
        }
      }),
    [queryClient],
  );

  return null;
};
