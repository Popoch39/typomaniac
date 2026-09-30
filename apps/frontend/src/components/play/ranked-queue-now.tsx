import { useId, useRef } from "react";

import { useWatchQueue } from "@/components/play/use-watch-queue";
import { useQueueDotPulse } from "@/components/sidebar/use-queue-dot-pulse";
import { estimatedWaitLabel, queueOverviewSizeLabel } from "@/lib/queue-wait";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useConnectionStore } from "@/stores/connection-store";

// « En file maintenant », its dot pulsing, then how many Users wait in the Queue and the Estimated
// wait, told live while the card is shown: only the size without a recent pairing, nothing until
// the server tells it. Never who is in it.
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
    <section aria-labelledby={titleId} className="flex shrink-0 flex-col text-sm leading-5">
      <h3
        id={titleId}
        className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase opacity-80"
      >
        <span ref={dotRef} aria-hidden="true" className="size-2 rounded-full bg-on-brand" />
        {m.play_ranked_queue_now({}, { locale })}
      </h3>
      <p className="flex items-center gap-2 font-semibold">
        <span>{queueOverviewSizeLabel(overview.size, locale)}</span>
        {estimate === null ? null : (
          <>
            <span aria-hidden="true" className="opacity-60">
              ·
            </span>
            <span>{estimate}</span>
          </>
        )}
      </p>
    </section>
  );
};
