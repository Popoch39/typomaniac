import { useQueueWaitSince } from "@/components/duel/use-queue-wait-since";
import { QueueWaitLine } from "@/components/sidebar/queue-wait-line";

// Under Jouer in the Rail's tooltip, while the User waits in the Queue: since when, in words, as
// the Rail keeps only the dot on the icon. Nothing outside the Queue.
export const QueueWaitHint = () => {
  const since = useQueueWaitSince();

  return since === null ? null : <QueueWaitLine joinedAt={since.joinedAt} clock={since.clock} />;
};
