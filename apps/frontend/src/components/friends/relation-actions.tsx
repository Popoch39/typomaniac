import type { UserFound } from "@/api/user-search";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { atHandle } from "@/lib/at-handle";

type RelationActionsProps = {
  user: UserFound;
};

// What the searcher can do with a User found, given where they stand with them.
export const RelationActions = ({ user }: RelationActionsProps) => {
  const handle = atHandle(user.handle);

  switch (user.relation) {
    case "none": {
      return (
        <FriendActionButton
          action="send"
          userId={user.id}
          label={`Envoyer une Friend request à ${handle}`}
        >
          Ajouter
        </FriendActionButton>
      );
    }

    case "request-sent": {
      return (
        <FriendActionButton
          action="cancel"
          userId={user.id}
          variant="ghost"
          label={`Annuler la Friend request à ${handle}`}
        >
          Annuler
        </FriendActionButton>
      );
    }

    case "request-received": {
      return (
        <FriendActionButton
          action="accept"
          userId={user.id}
          variant="default"
          label={`Accepter la Friend request de ${handle}`}
        >
          Accepter
        </FriendActionButton>
      );
    }

    case "friend": {
      return (
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.7rem] text-muted-foreground uppercase">
          Friend
        </span>
      );
    }
  }
};
