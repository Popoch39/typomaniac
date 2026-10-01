import { FRIEZE_WEEKS } from "@/components/history/history-week";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

const WEEKS = Array.from({ length: FRIEZE_WEEKS }, (_, index) => `week-${index}`);

// A row of cards: three, as a day lays them out.
const CARDS = Array.from({ length: 3 }, (_, index) => `card-${index}`);

// The frieze and a day of cards, at their places, while the History loads.
export const HistorySkeleton = () => {
  const locale = useLocale();

  return (
    <LoadingRegion label={m.history_loading({}, { locale })} className="gap-8">
      <div className="flex items-center gap-10 rounded-card bg-card px-7 py-6">
        <div className="flex grow gap-1">
          {WEEKS.map((week) => (
            <Skeleton key={week} className="h-34 w-7 rounded-[10px]" />
          ))}
        </div>
        <Skeleton className="h-16 w-72" />
      </div>
      <Skeleton className="h-8 w-80" />
      <div className="grid grid-cols-3 gap-3">
        {CARDS.map((card) => (
          <Skeleton key={card} className="h-58 rounded-[24px]" />
        ))}
      </div>
    </LoadingRegion>
  );
};
