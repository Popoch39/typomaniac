import { useWatchQueue } from "@/components/play/use-watch-queue";
import { estimatedWaitLabel, queueOverviewSizeLabel } from "@/lib/queue-wait";
import { useLocale } from "@/locale/use-locale";
import { useConnectionStore } from "@/stores/connection-store";

// How many Users wait in the Queue and the Estimated wait, told live while the card is shown; only
// the size without a recent pairing, nothing until the server tells it.
export const RankedQueueOverview = () => {
  const locale = useLocale();
  const overview = useConnectionStore((store) => store.queueOverview);

  useWatchQueue();

  if (overview === null) {
    return null;
  }

  const estimate = estimatedWaitLabel(overview.estimatedWait, locale);

  return (
    <p className="flex items-center gap-2 text-sm font-semibold">
      <span>{queueOverviewSizeLabel(overview.size, locale)}</span>
      {estimate === null ? null : (
        <>
          <span aria-hidden className="opacity-60">
            ·
          </span>
          <span>{estimate}</span>
        </>
      )}
    </p>
  );
};
