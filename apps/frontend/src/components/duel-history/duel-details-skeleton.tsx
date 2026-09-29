import { DuelChartSkeleton } from "@/components/duel-chart/duel-chart-skeleton";
import { DUEL_RESULT_IDS } from "@/components/duel-history/duel-result-lines";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The chosen Duel's details while they load: its Duel chart, the Results table, then the way to its
// Replay.
export const DuelDetailsSkeleton = () => {
  const locale = useLocale();

  return (
    <LoadingRegion label={m.duel_details_loading({}, { locale })} className="gap-5">
      <DuelChartSkeleton />
      <div className="flex flex-col gap-3.5">
        {DUEL_RESULT_IDS.map((line) => (
          <Skeleton key={line} className="h-5 w-full" />
        ))}
      </div>
      <Skeleton className="h-12 w-44 rounded-[14px]" />
    </LoadingRegion>
  );
};
