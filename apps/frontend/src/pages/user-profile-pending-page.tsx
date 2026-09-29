import { ProfileStatsSkeleton } from "@/components/profile/profile-stats-skeleton";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A User's Profile while it loads: the header card, then the Stats.
export const UserProfilePendingPage = () => {
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-6">
      <LoadingRegion label={m.profile_loading({}, { locale })}>
        <div className="flex items-center gap-4 rounded-card bg-card p-5">
          <Skeleton className="size-16 rounded-[33%]" />
          <Skeleton className="h-9 w-40" />
        </div>
      </LoadingRegion>
      <ProfileStatsSkeleton />
    </section>
  );
};
