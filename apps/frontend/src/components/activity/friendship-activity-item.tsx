import type { Activity } from "@/api/activity";
import { ActivityRow } from "@/components/activity/activity-row";
import { HandleLink } from "@/components/handle/handle-link";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type FriendshipActivityItemProps = {
  activity: Extract<Activity, { type: "friendship" }>;
  now: number;
};

// A Friend's new friendship, with the User themselves too.
export const FriendshipActivityItem = ({ activity, now }: FriendshipActivityItemProps) => {
  const locale = useLocale();

  return (
    <ActivityRow friend={activity.friend} at={activity.at} now={now}>
      {withSlots((marks) => m.activity_friendship(marks, { locale }), {
        friend: <HandleLink handle={activity.friend.handle} className="font-semibold" />,
        other: <HandleLink handle={activity.other.handle} className="font-semibold" />,
      })}
    </ActivityRow>
  );
};
