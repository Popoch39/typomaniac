import { cn } from "cn";

import { PRESENCE_DOTS, PRESENCE_LABELS } from "@/components/friends/presence-paint";
import { useConnectionStore } from "@/stores/connection-store";

type FriendPresenceProps = {
  userId: string;
};

// A Friend's Presence, live: a dot and its word. Nothing until the connection is told it.
export const FriendPresence = ({ userId }: FriendPresenceProps) => {
  const presence = useConnectionStore((store) =>
    store.friends === null ? null : (store.friends.presences.get(userId) ?? "offline"),
  );

  return presence === null ? null : (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[0.7rem] text-muted-foreground">
      <span aria-hidden className={cn("size-2 rounded-full", PRESENCE_DOTS[presence])} />
      {PRESENCE_LABELS[presence]}
    </span>
  );
};
