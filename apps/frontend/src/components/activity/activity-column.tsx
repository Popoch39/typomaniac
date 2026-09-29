import { Suspense, useId } from "react";

import { ActivityList } from "@/components/activity/activity-list";
import { ActivitySkeleton } from "@/components/activity/activity-skeleton";
import { SMALL_TITLE_PAINT } from "@/components/small-title-paint";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type ActivityColumnProps = {
  // Where the empty Activity sends the User to find Friends.
  searchInputId: string;
};

// The Activity of the User's Friends, next to their lists: it loads on its own, never holding the
// page back.
export const ActivityColumn = ({ searchInputId }: ActivityColumnProps) => {
  const titleId = useId();
  const locale = useLocale();

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2.5">
      <h2 id={titleId} className={SMALL_TITLE_PAINT}>
        {m.activity_title({}, { locale })}
      </h2>
      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityList searchInputId={searchInputId} />
      </Suspense>
    </section>
  );
};
