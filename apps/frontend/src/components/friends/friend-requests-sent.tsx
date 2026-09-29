import { useSuspenseQuery } from "@tanstack/react-query";

import { friendRequestsQueryOptions } from "@/api/friends";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { FriendsListSection } from "@/components/friends/friends-list-section";
import { UserRow } from "@/components/friends/user-row";
import { atHandle } from "@/lib/at-handle";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Friend requests the User sent, still waiting for an answer.
export const FriendRequestsSent = () => {
  const { data: sent } = useSuspenseQuery({
    ...friendRequestsQueryOptions,
    select: (requests) => requests.sent,
  });

  const locale = useLocale();

  return (
    <FriendsListSection
      title={m.friends_sent_title({ count: numberFormat(locale).format(sent.length) }, { locale })}
      isEmpty={sent.length === 0}
      empty={
        <p className="px-1 text-sm text-muted-foreground">{m.friends_sent_none({}, { locale })}</p>
      }
    >
      {sent.map((user) => (
        <UserRow
          key={user.id}
          user={user}
          aside={
            <span className="text-xs text-muted-foreground">
              {m.friends_sent_pending({}, { locale })}
            </span>
          }
        >
          <FriendActionButton
            action="cancel"
            userId={user.id}
            variant="ghost"
            label={m.friends_cancel_label({ handle: atHandle(user.handle) }, { locale })}
          >
            {m.friends_cancel({}, { locale })}
          </FriendActionButton>
        </UserRow>
      ))}
    </FriendsListSection>
  );
};
