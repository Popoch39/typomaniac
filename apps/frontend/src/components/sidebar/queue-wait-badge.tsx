import { useQueueWaitSince } from "@/components/duel/use-queue-wait-since";
import { QueueWaitIndicator } from "@/components/sidebar/queue-wait-indicator";

// The User's wait in the Queue on the sidebar's Jouer, in the tab that plays it as in the others:
// nothing outside the Queue.
export const QueueWaitBadge = () => {
  const since = useQueueWaitSince();

  return since === null ? null : (
    <QueueWaitIndicator joinedAt={since.joinedAt} clock={since.clock} />
  );
};
