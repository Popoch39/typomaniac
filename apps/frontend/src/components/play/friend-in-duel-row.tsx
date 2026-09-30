import type { PresentFriend } from "@/components/friends/online-friends";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A Friend in a Duel right now, by their Presence: « @zoe est en Duel ». Never to watch.
export const FriendInDuelRow = ({ friend }: { friend: PresentFriend }) => {
  const locale = useLocale();

  return (
    <li className="gap-2 text-sm">
      <UserAvatar
        handle={friend.handle}
        image={friend.image}
        size="sm"
        fallbackClassName="bg-surface-2 text-[10px] font-bold text-foreground"
      />
      <span className="min-w-0 truncate font-semibold">
        {m.play_friends_in_duel({ friend: atHandle(friend.handle) }, { locale })}
      </span>
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-destructive" />
    </li>
  );
};
