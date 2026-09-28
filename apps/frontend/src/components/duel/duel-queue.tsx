import { QueueFriends } from "@/components/duel/queue-friends";
import { QueueLocked } from "@/components/duel/queue-locked";
import { QueueSearch } from "@/components/duel/queue-search";
import { useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";

// Waiting in the Queue for an opponent, with the Friends to challenge meanwhile. Annuler goes back
// to Solo, which leaves the Queue. Refused it during a Queue lock, the search waits for its end.
export const DuelQueue = () => {
  const setPlay = usePlayStore((state) => state.setPlay);

  const queue = useDuelStore((store) =>
    store.state.phase === "queued" ? store.state.queue : null,
  );

  const lockedUntil = useDuelStore((store) =>
    store.state.phase === "locked" ? store.state.until : null,
  );

  const solo = () => setPlay("solo");

  return (
    <div className="grid min-h-[34rem] grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5">
      {lockedUntil === null ? (
        <QueueSearch queue={queue} onCancel={solo} />
      ) : (
        <QueueLocked until={lockedUntil} onSolo={solo} />
      )}
      <QueueFriends />
    </div>
  );
};
