import type { UserFound } from "@/api/user-search";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type RelationActionsProps = {
  user: UserFound;
};

// What the searcher can do with a User found, given where they stand with them.
export const RelationActions = ({ user }: RelationActionsProps) => {
  const locale = useLocale();
  const handle = atHandle(user.handle);

  switch (user.relation) {
    case "none": {
      return (
        <FriendActionButton
          action="send"
          userId={user.id}
          label={m.friends_send_label({ handle }, { locale })}
        >
          {m.friends_send({}, { locale })}
        </FriendActionButton>
      );
    }

    case "request-sent": {
      return (
        <FriendActionButton
          action="cancel"
          userId={user.id}
          variant="ghost"
          label={m.friends_cancel_label({ handle }, { locale })}
        >
          {m.friends_cancel({}, { locale })}
        </FriendActionButton>
      );
    }

    case "request-received": {
      return (
        <FriendActionButton
          action="accept"
          userId={user.id}
          variant="default"
          label={m.friends_accept_label({ handle }, { locale })}
        >
          {m.friends_accept({}, { locale })}
        </FriendActionButton>
      );
    }

    case "friend": {
      return (
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.7rem] text-muted-foreground uppercase">
          {m.friends_relation_friend({}, { locale })}
        </span>
      );
    }
  }
};
