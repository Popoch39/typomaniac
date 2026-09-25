import type { Activity } from "@/api/activity";
import { ActivityRow } from "@/components/activity/activity-row";
import { HandleLink } from "@/components/handle/handle-link";

type FriendshipActivityItemProps = {
  activity: Extract<Activity, { type: "friendship" }>;
  now: number;
};

// A Friend's new friendship, with the User themselves too.
export const FriendshipActivityItem = ({ activity, now }: FriendshipActivityItemProps) => (
  <ActivityRow friend={activity.friend} at={activity.at} now={now}>
    <HandleLink handle={activity.friend.handle} className="font-semibold" /> et{" "}
    <HandleLink handle={activity.other.handle} className="font-semibold" /> sont maintenant Friends
  </ActivityRow>
);
