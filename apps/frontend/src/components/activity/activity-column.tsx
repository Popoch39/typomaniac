import { Suspense, useId } from "react";

import { ActivityList } from "@/components/activity/activity-list";
import { ActivitySkeleton } from "@/components/activity/activity-skeleton";
import { FRIENDS_TITLE_PAINT } from "@/components/friends/friends-paint";

type ActivityColumnProps = {
  // Where the empty Activity sends the User to find Friends.
  searchInputId: string;
};

// The Activity of the User's Friends, next to their lists: it loads on its own, never holding the
// page back.
export const ActivityColumn = ({ searchInputId }: ActivityColumnProps) => {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2.5">
      <h2 id={titleId} className={FRIENDS_TITLE_PAINT}>
        Activity
      </h2>
      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityList searchInputId={searchInputId} />
      </Suspense>
    </section>
  );
};
