import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The wpm curve while a window loads for the first time: its box, at its height.
export const WpmChartSkeleton = () => {
  const locale = useLocale();

  return (
    <LoadingRegion label={m.profile_progression_loading({}, { locale })}>
      <Skeleton className="h-93 w-full rounded-[20px]" />
    </LoadingRegion>
  );
};
