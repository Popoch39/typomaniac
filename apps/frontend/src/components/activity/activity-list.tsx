import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { activityQueryOptions } from "@/api/activity";
import { ActivityEmpty } from "@/components/activity/activity-empty";
import { DuelActivityItem } from "@/components/activity/duel-activity-item";
import { FriendshipActivityItem } from "@/components/activity/friendship-activity-item";

type ActivityListProps = { searchInputId: string };

// The last Activities of the User's Friends, the newest first, each dated from when it was read.
export const ActivityList = ({ searchInputId }: ActivityListProps) => {
  const { data: activities } = useSuspenseQuery(activityQueryOptions);
  const [now] = useState(() => Date.now());

  if (activities.length === 0) {
    return <ActivityEmpty searchInputId={searchInputId} />;
  }

  return (
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-card bg-card">
      {activities.map((activity) =>
        activity.type === "duel" ? (
          <DuelActivityItem key={`duel:${activity.id}`} activity={activity} now={now} />
        ) : (
          <FriendshipActivityItem key={`friendship:${activity.id}`} activity={activity} now={now} />
        ),
      )}
    </ul>
  );
};
