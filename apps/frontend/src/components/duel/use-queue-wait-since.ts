import { type Clock, useClock, wallClock } from "@/components/run/clock-context";
import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore, waitingQueueOf } from "@/stores/duel-store";

export type QueueWaitSince = { joinedAt: number; clock: Clock };

// Since when the User waits in the Queue, their Match proposal included, and on which clock: this
// tab's once the server told its status here, or the one the server told of the tab that plays it.
// Null outside the Queue.
export const useQueueWaitSince = (): QueueWaitSince | null => {
  const tabClock = useClock();
  const here = useDuelStore((store) => waitingQueueOf(store.state)?.joinedAt ?? null);

  const elsewhere = useConnectionStore((store) =>
    store.place?.at === "queue" && !store.place.here ? store.place.joinedAt : null,
  );

  if (here !== null) {
    return { joinedAt: here, clock: tabClock };
  }

  return elsewhere === null ? null : { joinedAt: elsewhere, clock: wallClock };
};
