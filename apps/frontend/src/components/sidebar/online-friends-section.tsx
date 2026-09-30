import { Link } from "@tanstack/react-router";
import { useId, useRef } from "react";

import { sidebarFriendRows } from "@/components/friends/online-friends";
import { useOnlineFriends } from "@/components/friends/use-online-friends";
import { OnlineFriendRow } from "@/components/sidebar/online-friend-row";
import { OnlineFriendsSkeleton } from "@/components/sidebar/online-friends-skeleton";
import { RailFriendRow } from "@/components/sidebar/rail-friend-row";
import { RailFriendsMore } from "@/components/sidebar/rail-friends-more";
import { railRowsShown, useRailRoom } from "@/components/sidebar/use-rail-room";
import { useSidebarRail } from "@/components/sidebar/use-sidebar-rail";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useDuelStore } from "@/stores/duel-store";

// « Online · N »: the Friends there, to challenge from any page, then the way to all of them. In
// the Rail, their avatars in a column, as many as fit above the foot, then how many more are there,
// the way to all of them; the words kept for screen readers only. The Rail never scrolls.
export const OnlineFriendsSection = () => {
  const online = useOnlineFriends();
  const queued = useDuelStore((store) => store.state.phase === "queued");
  const rail = useSidebarRail();
  const titleId = useId();
  const locale = useLocale();
  const zoneRef = useRef<HTMLDivElement>(null);
  const room = useRailRoom(zoneRef, rail);

  if (online === null) {
    return <OnlineFriendsSkeleton />;
  }

  const { rows: sidebarRows, count } = sidebarFriendRows(online.present);

  const rows =
    room === null
      ? sidebarRows
      : sidebarRows.slice(0, railRowsShown(room, sidebarRows.length, count));

  const numbers = numberFormat(locale);
  const allLabel = m.sidebar_online_all({ count: numbers.format(online.friendCount) }, { locale });

  return (
    <section
      data-intro="online"
      aria-labelledby={titleId}
      className="flex flex-col pt-5 rail:min-h-0 rail:flex-1"
    >
      <h2
        id={titleId}
        className="px-3.5 pb-1.5 font-mono text-[0.66rem] font-medium tracking-[0.06em] text-muted-foreground uppercase rail:sr-only"
      >
        {m.sidebar_online_title({ count: numbers.format(count) }, { locale })}
      </h2>
      {/* Challenging keeps the User's place: a pairing or an accepted Challenge, first one wins. */}
      {queued ? (
        <p className="px-3.5 pb-1.5 text-xs text-muted-foreground rail:sr-only">
          {m.sidebar_online_queued({}, { locale })}
        </p>
      ) : null}
      <div ref={zoneRef} className="flex flex-col rail:min-h-0 rail:flex-1">
        {rows.length === 0 ? (
          <p className="px-3.5 py-2 text-sm text-muted-foreground rail:sr-only">
            {m.sidebar_online_none({}, { locale })}
          </p>
        ) : (
          <ul className="flex flex-col">
            {rows.map((friend) =>
              rail ? (
                <RailFriendRow key={friend.id} friend={friend} />
              ) : (
                <OnlineFriendRow key={friend.id} friend={friend} />
              ),
            )}
          </ul>
        )}
        {rail ? (
          <RailFriendsMore more={count - rows.length} label={allLabel} />
        ) : (
          <Link
            to="/friends"
            className="rounded-xl px-3.5 py-2 text-[0.8rem] font-medium text-muted-foreground hover:text-foreground focus-visible:text-foreground"
          >
            {allLabel}
          </Link>
        )}
      </div>
    </section>
  );
};
