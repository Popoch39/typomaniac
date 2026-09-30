import { useQueueElapsed } from "@/components/duel/use-queue-elapsed";
import { estimatedWaitLabel, formatElapsed } from "@/lib/queue-wait";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { QueueView } from "@/stores/duel-store";

type QueuePillWaitProps = {
  queue: QueueView;
};

// Under the Queue pill's title: since when the User waits, then the Estimated wait, if any.
export const QueuePillWait = ({ queue }: QueuePillWaitProps) => {
  const locale = useLocale();
  const elapsed = useQueueElapsed(queue.joinedAt);
  const estimate = estimatedWaitLabel(queue.estimatedWait, locale);

  return (
    <div className="flex items-baseline gap-2">
      <span
        role="timer"
        aria-label={m.queue_wait_label({}, { locale })}
        className="font-mono text-lg font-bold tabular-nums"
      >
        {formatElapsed(elapsed)}
      </span>
      {estimate === null ? null : (
        <span className="truncate text-[13px] text-muted-foreground">{estimate}</span>
      )}
    </div>
  );
};
