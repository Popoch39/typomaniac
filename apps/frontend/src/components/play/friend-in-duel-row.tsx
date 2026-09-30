import type { PresentFriend } from "@/components/friends/online-friends";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { RowHandle } from "@/components/play/row-handle";
import { RowSentence } from "@/components/play/row-sentence";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A Friend in a Duel right now, by their Presence: « @zoe est en Duel ». Never to watch.
export const FriendInDuelRow = ({ friend }: { friend: PresentFriend }) => {
  const locale = useLocale();

  return (
    <li className="gap-2 text-sm play-rows-slim:gap-1.5 play-rows-slim:text-xs">
      <UserAvatar
        handle={friend.handle}
        image={friend.image}
        size="sm"
        fallbackClassName="bg-surface-2 text-[10px] font-bold text-foreground"
      />
      <RowSentence>
        {withSlots((marks) => m.play_friends_in_duel(marks, { locale }), {
          friend: <RowHandle handle={friend.handle} />,
        })}
      </RowSentence>
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-destructive" />
    </li>
  );
};
