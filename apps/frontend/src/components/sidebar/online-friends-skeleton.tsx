import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Stable keys for the placeholder rows (they have no identity of their own).
const SKELETON_ROWS = ["a", "b", "c"];

// While the Friends or their Presences are read: rows in their place, never a text.
export const OnlineFriendsSkeleton = () => {
  const locale = useLocale();

  return (
    <LoadingRegion label={m.sidebar_online_loading({}, { locale })} className="gap-0 pt-5">
      {SKELETON_ROWS.map((row) => (
        <div key={row} className="flex h-12 items-center gap-2.5 pl-2.5">
          <Skeleton className="size-8 rounded-[33%]" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      ))}
    </LoadingRegion>
  );
};
