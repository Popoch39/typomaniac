import { ActivityRow } from "@/components/activity/activity-row";
import { HandleLink } from "@/components/handle/handle-link";
import type { Arrival } from "@/lib/activity-feed";

type ArrivalActivityItemProps = { arrival: Arrival; now: number };

// A Friend who just came online, shown only since the tab heard it.
export const ArrivalActivityItem = ({ arrival, now }: ArrivalActivityItemProps) => (
  <ActivityRow friend={arrival.friend} at={arrival.at} now={now}>
    <HandleLink handle={arrival.friend.handle} className="font-semibold" /> est en ligne
  </ActivityRow>
);
