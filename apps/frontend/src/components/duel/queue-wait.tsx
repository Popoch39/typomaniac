import { useQueueElapsed } from "@/components/duel/use-queue-elapsed";
import { estimatedWaitLabel, formatElapsed, queueSizeLabel } from "@/lib/queue-wait";
import type { QueueView } from "@/stores/duel-store";

type QueueWaitProps = {
  queue: QueueView;
};

// Since when the User waits, how many wait with them and how long it usually takes.
export const QueueWait = ({ queue }: QueueWaitProps) => {
  const elapsed = useQueueElapsed(queue.joinedAt);
  const estimate = estimatedWaitLabel(queue.estimatedWait);

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-2xl tabular-nums" aria-label="Temps d'attente">
        {formatElapsed(elapsed)}
      </span>
      <span aria-hidden className="text-faint">
        ·
      </span>
      <span className="text-sm text-muted-foreground">
        {estimate === null ? null : `${estimate} · `}
        {queueSizeLabel(queue.size)}
      </span>
    </div>
  );
};
