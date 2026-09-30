import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { useOnlineFriends } from "@/components/friends/use-online-friends";
import { EmptyAvatar } from "@/components/play/empty-avatar";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// 88 px, less in a narrow card (its width, `cqi`): the two faces and « vs » always fit in it.
const FACE_LOOK = "size-[min(5.5rem,27cqi)]";

const INITIALS_LOOK = "text-[min(2.25rem,11cqi)] font-extrabold";

// The User facing their first Friend online, avatar to avatar: an empty one where there is none
// (a Visitor, no Friend online, or their Presences not told yet). Screen readers hear who it is.
export const FriendsFaceToFace = () => {
  const locale = useLocale();
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const online = useOnlineFriends();
  const friend = online?.present.find((present) => present.presence === "online") ?? null;

  return (
    <div className="flex items-center gap-3.5">
      {me === null ? (
        <EmptyAvatar className={FACE_LOOK} />
      ) : (
        <UserAvatar
          handle={me.handle ?? me.name}
          image={me.image}
          ornament={me.ornament}
          className={FACE_LOOK}
          fallbackClassName={INITIALS_LOOK}
        />
      )}
      <span aria-hidden="true" className="text-xl font-extrabold text-muted-foreground">
        {m.play_friends_versus({}, { locale })}
      </span>
      {friend === null ? (
        <EmptyAvatar className={FACE_LOOK} />
      ) : (
        <>
          <UserAvatar
            handle={friend.handle}
            image={friend.image}
            ornament={friend.ornament}
            className={FACE_LOOK}
            fallbackClassName={INITIALS_LOOK}
          />
          <p className="sr-only">
            {m.play_friends_facing({ friend: atHandle(friend.handle) }, { locale })}
          </p>
        </>
      )}
    </div>
  );
};
