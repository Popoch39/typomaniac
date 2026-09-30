import { useQueueElapsed } from "@/components/duel/use-queue-elapsed";
import type { QueueWaitSince } from "@/components/duel/use-queue-wait-since";
import { formatElapsed } from "@/lib/queue-wait";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Since when the User waits in the Queue, in words, ticking with the tab's clock.
export const QueueWaitLine = ({ joinedAt, clock }: QueueWaitSince) => {
  const locale = useLocale();
  const elapsed = formatElapsed(useQueueElapsed(joinedAt, clock));

  return (
    <span className="font-normal tabular-nums">
      {m.sidebar_queue_wait({ elapsed }, { locale })}
    </span>
  );
};
