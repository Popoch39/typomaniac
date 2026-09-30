import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";

import { activityQueryOptions } from "@/api/activity";
import { useOnlineFriends } from "@/components/friends/use-online-friends";
import { FriendDuelRow } from "@/components/play/friend-duel-row";
import { FriendInDuelRow } from "@/components/play/friend-in-duel-row";
import { friendsLiveRows } from "@/components/play/friends-live-rows";
import { FriendsFaceToFace } from "@/components/play/friends-face-to-face";
import { PlayCardRows } from "@/components/play/play-card-rows";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// « Chez tes Friends »: the Friends in a Duel right now, then their last Duels, each Activity told
// live putting itself first (LiveActivity writes the cache read here). Never making the card wait;
// without a row (no Friend, nothing done yet, not read yet), the User facing a Friend online.
export const FriendsLive = ({ readerId }: { readerId: string }) => {
  const locale = useLocale();
  const { data: activities } = useQuery(activityQueryOptions);
  const online = useOnlineFriends();
  const [now] = useState(() => Date.now());
  const titleId = useId();
  const present = online?.present ?? [];
  const rows = friendsLiveRows(activities ?? [], present);

  if (rows.length === 0) {
    return <FriendsFaceToFace />;
  }

  const title = m.play_friends_live({}, { locale });

  return (
    <section aria-labelledby={titleId} className="flex min-h-0 w-full flex-1 flex-col gap-2">
      <h3
        id={titleId}
        className="shrink-0 text-xs leading-5 font-bold tracking-wide text-muted-foreground uppercase"
      >
        {title}
      </h3>
      <PlayCardRows label={title}>
        {rows.map((row) =>
          row.kind === "in-duel" ? (
            <FriendInDuelRow key={`in-duel:${row.friend.id}`} friend={row.friend} />
          ) : (
            <FriendDuelRow
              key={`duel:${row.activity.id}`}
              activity={row.activity}
              readerId={readerId}
              friendOnline={present.some(
                ({ id, presence }) => id === row.activity.friend.id && presence === "online",
              )}
              now={now}
            />
          ),
        )}
      </PlayCardRows>
    </section>
  );
};
