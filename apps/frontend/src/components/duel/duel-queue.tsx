import { QueueLocked } from "@/components/duel/queue-locked";
import { QueueSearch } from "@/components/duel/queue-search";
import { QueueTip } from "@/components/duel/queue-tip";
import { useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";

// Waiting in the Queue for an opponent, one card in the middle of the page; the Friends to
// challenge meanwhile are in the sidebar. Annuler goes back to Solo, which leaves the Queue.
// Refused it during a Queue lock, the search waits for its end.
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
    <div className="flex flex-1 flex-col items-center justify-center gap-5.5">
      {lockedUntil === null ? (
        <>
          <QueueSearch queue={queue} onCancel={solo} />
          <QueueTip />
        </>
      ) : (
        <QueueLocked until={lockedUntil} onSolo={solo} />
      )}
    </div>
  );
};
