import { ActivitySkeleton } from "@/components/activity/activity-skeleton";
import { UserRowsSkeleton } from "@/components/friends/user-rows-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// The Friends page while the User's Friends and Friend requests load: the search, then the lists,
// and the Activity next to them.
export const FriendsPendingPage = () => (
  <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-12">
    <h1 className="text-lg font-bold">Friends</h1>
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-8">
        <Skeleton className="h-11 w-full rounded-full" />
        <UserRowsSkeleton label="Chargement des Friend requests" rows={1} />
        <UserRowsSkeleton label="Chargement des Friends" />
      </div>
      <ActivitySkeleton />
    </div>
  </section>
);
