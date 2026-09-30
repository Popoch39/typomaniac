import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The wpm curve while a window loads for the first time: its box, on the rest of its tile.
export const WpmChartSkeleton = () => {
  const locale = useLocale();

  return (
    <LoadingRegion label={m.profile_progression_loading({}, { locale })} className="min-h-0 flex-1">
      <Skeleton className="min-h-0 w-full flex-1 rounded-[20px]" />
    </LoadingRegion>
  );
};
