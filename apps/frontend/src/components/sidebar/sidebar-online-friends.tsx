import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useId } from "react";

import { meQueryOptions } from "@/api/me";
import { sidebarFriendRows } from "@/components/friends/online-friends";
import { useOnlineFriends } from "@/components/friends/use-online-friends";
import { OnlineFriendRow } from "@/components/sidebar/online-friend-row";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { useDuelStore } from "@/stores/duel-store";

// Stable keys for the placeholder rows (they have no identity of their own).
const SKELETON_ROWS = ["a", "b", "c"];

// While the Friends or their Presences are read: rows in their place, never a text.
const OnlineFriendsSkeleton = () => (
  <LoadingRegion label="Chargement des Friends en ligne" className="gap-0 pt-5">
    {SKELETON_ROWS.map((row) => (
      <div key={row} className="flex h-12 items-center gap-2.5 pl-2.5">
        <Skeleton className="size-8 rounded-[33%]" />
        <Skeleton className="h-3.5 w-24" />
      </div>
    ))}
  </LoadingRegion>
);

// « En ligne · N »: the Friends there, to challenge from any page, then the way to all of them.
const OnlineFriends = () => {
  const online = useOnlineFriends();
  const queued = useDuelStore((store) => store.state.phase === "queued");
  const titleId = useId();

  if (online === null) {
    return <OnlineFriendsSkeleton />;
  }

  const { rows, count } = sidebarFriendRows(online.present);

  return (
    <section aria-labelledby={titleId} className="flex flex-col pt-5">
      <h2
        id={titleId}
        className="px-3.5 pb-1.5 font-mono text-[0.66rem] font-medium tracking-[0.06em] text-muted-foreground uppercase"
      >
        En ligne · {count}
      </h2>
      {/* Challenging keeps the User's place: a pairing or an accepted Challenge, first one wins. */}
      {queued ? (
        <p className="px-3.5 pb-1.5 text-xs text-muted-foreground">
          Défie-les sans quitter la Queue.
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="px-3.5 py-2 text-sm text-muted-foreground">Aucun Friend en ligne</p>
      ) : (
        <ul className="flex flex-col">
          {rows.map((friend) => (
            <OnlineFriendRow key={friend.id} friend={friend} />
          ))}
        </ul>
      )}
      <Link
        to="/friends"
        className="rounded-xl px-3.5 py-2 text-[0.8rem] font-medium text-muted-foreground hover:text-foreground focus-visible:text-foreground"
      >
        Tous tes Friends · {online.friendCount}
      </Link>
    </section>
  );
};

// Under the nav, for a User with a Handle only: a Visitor has no Friends, nor has a User before
// choosing a Handle.
export const SidebarOnlineFriends = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  return me?.handle ? <OnlineFriends /> : null;
};
