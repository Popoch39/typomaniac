import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { activityQueryOptions } from "@/api/activity";
import { ActivityEmpty } from "@/components/activity/activity-empty";
import { ArrivalActivityItem } from "@/components/activity/arrival-activity-item";
import { DuelActivityItem } from "@/components/activity/duel-activity-item";
import { FriendshipActivityItem } from "@/components/activity/friendship-activity-item";
import { feedItems } from "@/lib/activity-feed";
import { useConnectionStore } from "@/stores/connection-store";

type ActivityListProps = { searchInputId: string };

// The last Activities of the User's Friends and the arrivals told since the tab opened, the newest
// first, each dated from when it was read.
export const ActivityList = ({ searchInputId }: ActivityListProps) => {
  const { data: activities } = useSuspenseQuery(activityQueryOptions);
  const arrivals = useConnectionStore((state) => state.arrivals);
  const [now] = useState(() => Date.now());
  const items = feedItems(activities, arrivals);

  if (items.length === 0) {
    return <ActivityEmpty searchInputId={searchInputId} />;
  }

  return (
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-card bg-card">
      {items.map((item) => {
        if (item.kind === "arrival") {
          return (
            <ArrivalActivityItem
              key={`arrival:${item.arrival.id}`}
              arrival={item.arrival}
              now={now}
            />
          );
        }

        const { activity } = item;

        return activity.type === "duel" ? (
          <DuelActivityItem key={`duel:${activity.id}`} activity={activity} now={now} />
        ) : (
          <FriendshipActivityItem key={`friendship:${activity.id}`} activity={activity} now={now} />
        );
      })}
    </ul>
  );
};
