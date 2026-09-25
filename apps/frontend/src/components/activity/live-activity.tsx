import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { activityQueryOptions } from "@/api/activity";
import { withActivity } from "@/lib/activity-feed";
import { onServerMessage } from "@/stores/connection-store";

// Puts each Activity the real-time connection tells first in the feed, without a reload, on any
// page: a feed not read yet stays unread. An ended friendship reads it again (`LiveFriendLists`).
export const LiveActivity = () => {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      onServerMessage((message) => {
        if (message.type === "activity-added") {
          queryClient.setQueryData(activityQueryOptions.queryKey, (feed) =>
            feed ? withActivity(feed, message.activity) : feed,
          );
        }
      }),
    [queryClient],
  );

  return null;
};
