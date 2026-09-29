import { useRef } from "react";

import { useQueueElapsed } from "@/components/duel/use-queue-elapsed";
import type { QueueWaitSince } from "@/components/duel/use-queue-wait-since";
import { useQueueDotPulse } from "@/components/sidebar/use-queue-dot-pulse";
import { formatElapsed } from "@/lib/queue-wait";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// At the end of the sidebar's Jouer while the User waits in the Queue: a dot that pulses, then
// since when they wait. In the accent, inverted on the current page, as the Friend requests' count.
export const QueueWaitIndicator = ({ joinedAt, clock }: QueueWaitSince) => {
  const locale = useLocale();
  const dotRef = useRef<HTMLSpanElement>(null);
  const elapsed = formatElapsed(useQueueElapsed(joinedAt, clock));

  useQueueDotPulse(dotRef);

  return (
    <span className="ml-auto flex items-center gap-2 font-mono text-xs font-medium text-sidebar-primary tabular-nums group-aria-[current=page]/menu-button:text-sidebar-primary-foreground">
      <span ref={dotRef} aria-hidden="true" className="size-2 rounded-full bg-current" />
      <span role="timer" aria-label={m.sidebar_queue_wait({ elapsed }, { locale })}>
        {elapsed}
      </span>
    </span>
  );
};
