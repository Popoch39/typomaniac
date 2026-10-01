import { HistoryHeader } from "@/components/history/history-header";
import { HistorySkeleton } from "@/components/history/history-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// The History while its week and its frieze load: their places, in Skeletons.
export const HistoryPendingPage = () => (
  <section className="mx-auto flex w-full max-w-300 flex-col gap-8 pt-2 pb-7 font-journal">
    <HistoryHeader nav={<Skeleton className="h-11 w-94 rounded-[14px]" />} />
    <HistorySkeleton />
  </section>
);
