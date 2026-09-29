import { ActivityRow } from "@/components/activity/activity-row";
import { HandleLink } from "@/components/handle/handle-link";
import type { Arrival } from "@/lib/activity-feed";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type ArrivalActivityItemProps = { arrival: Arrival; now: number };

// A Friend who just came online, shown only since the tab heard it.
export const ArrivalActivityItem = ({ arrival, now }: ArrivalActivityItemProps) => {
  const locale = useLocale();

  return (
    <ActivityRow friend={arrival.friend} at={arrival.at} now={now}>
      {withSlots((marks) => m.activity_arrival(marks, { locale }), {
        friend: <HandleLink handle={arrival.friend.handle} className="font-semibold" />,
      })}
    </ActivityRow>
  );
};
