import { useQueueElapsed } from "@/components/duel/use-queue-elapsed";
import { estimatedWaitLabel, formatElapsed, queueSizeLabel } from "@/lib/queue-wait";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { QueueView } from "@/stores/duel-store";

type QueueWaitProps = {
  queue: QueueView;
};

// Since when the User waits, how many wait with them and how long it usually takes.
export const QueueWait = ({ queue }: QueueWaitProps) => {
  const locale = useLocale();
  const elapsed = useQueueElapsed(queue.joinedAt);
  const estimate = estimatedWaitLabel(queue.estimatedWait, locale);

  return (
    <div className="flex items-center gap-3">
      <span
        className="font-mono text-2xl font-medium tabular-nums"
        aria-label={m.queue_wait_label({}, { locale })}
      >
        {formatElapsed(elapsed)}
      </span>
      <span aria-hidden className="text-faint">
        ·
      </span>
      <span className="text-sm text-muted-foreground">
        {estimate === null ? null : `${estimate} · `}
        {queueSizeLabel(queue.size, locale)}
      </span>
    </div>
  );
};
