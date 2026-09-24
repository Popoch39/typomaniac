import type { Presence } from "api";
import { cn } from "cn";

import { useConnectionStore } from "@/stores/connection-store";

const LABELS: Record<Presence, string> = {
  online: "en ligne",
  "in-duel": "en Duel",
  offline: "hors ligne",
};

const DOTS: Record<Presence, string> = {
  online: "bg-emerald-500",
  "in-duel": "bg-caret",
  offline: "bg-muted-foreground/40",
};

type FriendPresenceProps = {
  userId: string;
};

// A Friend's Presence, live: a dot and its word. Nothing until the connection is told it.
export const FriendPresence = ({ userId }: FriendPresenceProps) => {
  const presence = useConnectionStore((store) =>
    store.friends === null ? null : (store.friends.presences.get(userId) ?? "offline"),
  );

  return presence === null ? null : (
    <span className="flex shrink-0 items-center gap-1.5 text-[0.7rem] text-muted-foreground">
      <span aria-hidden className={cn("size-2 rounded-full", DOTS[presence])} />
      {LABELS[presence]}
    </span>
  );
};
