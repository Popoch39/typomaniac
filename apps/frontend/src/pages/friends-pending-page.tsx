import { ActivitySkeleton } from "@/components/activity/activity-skeleton";
import { FriendsColumns } from "@/components/friends/friends-columns";
import { FriendsGridSkeleton } from "@/components/friends/friends-grid-skeleton";
import { FriendsHeader } from "@/components/friends/friends-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Friends page while the User's Friends and Friend requests load, in its own shape: the search
// in the header, the tabs over the Friends' card, and the Activity next to them.
export const FriendsPendingPage = () => {
  const locale = useLocale();

  return (
    <section className="flex flex-1 flex-col gap-7">
      <FriendsHeader search={<Skeleton className="h-12 w-95 rounded-full" />} />
      <FriendsColumns
        lists={
          <div className="@container flex min-h-0 flex-1 flex-col gap-4">
            <Skeleton className="h-12 w-80 shrink-0 rounded-full" />
            <FriendsGridSkeleton label={m.friends_list_loading({}, { locale })} />
          </div>
        }
        activity={
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex h-12 shrink-0 items-center px-1">
              <Skeleton className="h-3 w-20" />
            </div>
            <ActivitySkeleton />
          </div>
        }
      />
    </section>
  );
};
