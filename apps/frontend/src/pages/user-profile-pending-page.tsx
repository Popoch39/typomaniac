import { ProfileStatsSkeleton } from "@/components/profile/profile-stats-skeleton";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

// A User's Profile while it loads: the header card, then the Stats.
export const UserProfilePendingPage = () => (
  <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-12">
    <LoadingRegion label="Chargement du Profile">
      <div className="flex items-center gap-4 rounded-card bg-card p-5">
        <Skeleton className="size-16 rounded-[33%]" />
        <Skeleton className="h-9 w-40" />
      </div>
    </LoadingRegion>
    <ProfileStatsSkeleton />
  </section>
);
