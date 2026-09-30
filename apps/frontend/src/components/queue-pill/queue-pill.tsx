import { QueuePillCard } from "@/components/queue-pill/queue-pill-card";
import { useQueuePillShown } from "@/components/queue-pill/use-queue-pill-shown";
import { useDuelStore, waitingQueueOf } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";

// The search folded, floating bottom right over any page of the tab that joined the Queue, out of
// the frame whose sidebar fades while a Run is typed. Annuler leaves the Queue without changing
// page: the Run under it goes on.
export const QueuePill = () => {
  const shown = useQueuePillShown();
  const setPlay = usePlayStore((state) => state.setPlay);
  const queue = useDuelStore((store) => waitingQueueOf(store.state));

  return shown ? <QueuePillCard queue={queue} onCancel={() => setPlay("solo")} /> : null;
};
