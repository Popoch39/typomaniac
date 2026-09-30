import { ProfileStatsSkeleton } from "@/components/profile/profile-stats-skeleton";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A User's Profile while it loads: the header (avatar, Handle and Duels, rank card), then the Stats.
export const UserProfilePendingPage = () => {
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-8">
      <LoadingRegion label={m.profile_loading({}, { locale })}>
        <div className="flex items-center gap-6">
          <Skeleton className="size-22 rounded-[33%]" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-21 w-72 rounded-[24px]" />
        </div>
      </LoadingRegion>
      <ProfileStatsSkeleton />
    </section>
  );
};
