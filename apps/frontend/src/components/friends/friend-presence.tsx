import type { Presence } from "api";
import { cn } from "cn";

import { PRESENCE_DOTS, PRESENCE_LABELS } from "@/components/friends/presence-paint";

// A Friend's Presence on their row: a dot and its word, in a pill.
export const FriendPresence = ({ presence }: { presence: Presence }) => (
  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-muted-foreground">
    <span aria-hidden className={cn("size-2 rounded-full", PRESENCE_DOTS[presence])} />
    {PRESENCE_LABELS[presence]}
  </span>
);
