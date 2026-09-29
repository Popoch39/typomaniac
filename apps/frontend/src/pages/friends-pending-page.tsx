import { ActivitySkeleton } from "@/components/activity/activity-skeleton";
import { FriendsColumns } from "@/components/friends/friends-columns";
import { FriendsHeader } from "@/components/friends/friends-header";
import { TitledSkeleton } from "@/components/friends/titled-skeleton";
import { UserRowsSkeleton } from "@/components/friends/user-rows-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Friends page while the User's Friends and Friend requests load, in its own shape: the
// search, each list on its card, and the Activity next to them.
export const FriendsPendingPage = () => {
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-6">
      <FriendsHeader />
      <FriendsColumns
        lists={
          <>
            <TitledSkeleton>
              <Skeleton className="h-12 w-full rounded-full" />
            </TitledSkeleton>
            <TitledSkeleton>
              <UserRowsSkeleton label={m.friends_received_loading({}, { locale })} rows={1} />
            </TitledSkeleton>
            <TitledSkeleton>
              <UserRowsSkeleton label={m.friends_sent_loading({}, { locale })} rows={1} />
            </TitledSkeleton>
            <TitledSkeleton>
              <UserRowsSkeleton label={m.friends_list_loading({}, { locale })} />
            </TitledSkeleton>
          </>
        }
        activity={
          <TitledSkeleton>
            <ActivitySkeleton />
          </TitledSkeleton>
        }
      />
    </section>
  );
};
