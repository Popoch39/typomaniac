import type { Presence } from "api";

import { useConnectionStore } from "@/stores/connection-store";

// A Friend's Presence, live, as the real-time connection keeps it: offline unless it says
// otherwise, null until it is told.
export const useFriendPresence = (userId: string): Presence | null =>
  useConnectionStore((store) =>
    store.friends === null ? null : (store.friends.presences.get(userId) ?? "offline"),
  );
