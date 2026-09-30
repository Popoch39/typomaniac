import { useId, useRef } from "react";

import { QueueCrowd } from "@/components/play/queue-crowd";
import { useWatchQueue } from "@/components/play/use-watch-queue";
import { useQueueDotPulse } from "@/components/sidebar/use-queue-dot-pulse";
import { estimatedWaitLabel } from "@/lib/queue-wait";
import { numberFormat } from "@/locale/formats";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useConnectionStore } from "@/stores/connection-store";

// The Queue as a crowd, the avatars of the last to join it, then « En file maintenant », its dot
// pulsing, and how many Users wait in the Queue, the number big, and the Estimated wait, told live
// while the card is shown: only the size without a recent pairing, nothing until the server tells
// it.
export const RankedQueueNow = () => {
  const locale = useLocale();
  const dotRef = useRef<HTMLSpanElement>(null);
  const titleId = useId();
  const overview = useConnectionStore((store) => store.queueOverview);

  useWatchQueue();
  useQueueDotPulse(dotRef);

  if (overview === null) {
    return null;
  }

  const estimate = estimatedWaitLabel(overview.estimatedWait, locale);

  return (
    <section aria-labelledby={titleId} className="flex shrink-0 items-center gap-4">
      <QueueCrowd overview={overview} />
      <div className="flex min-w-0 flex-col gap-1">
        <h3
          id={titleId}
          className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase"
        >
          <span ref={dotRef} aria-hidden="true" className="size-2 rounded-full bg-on-brand" />
          {m.play_ranked_queue_now({}, { locale })}
        </h3>
        <p className="text-sm leading-tight font-semibold">
          {withSlots(
            (marks) => m.queue_size({ count: overview.size, shown: marks.size }, { locale }),
            {
              size: (
                <span className="font-mono text-[40px] leading-none font-bold">
                  {numberFormat(locale).format(overview.size)}
                </span>
              ),
            },
          )}
          {estimate === null ? null : (
            <>
              <span aria-hidden="true" className="opacity-60">
                {" · "}
              </span>
              <span className="whitespace-nowrap">{estimate}</span>
            </>
          )}
        </p>
      </div>
    </section>
  );
};
