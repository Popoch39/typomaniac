import { QueuePillCard } from "@/components/queue-pill/queue-pill-card";
import { QueuePillProposal } from "@/components/queue-pill/queue-pill-proposal";
import { useQueuePillShown } from "@/components/queue-pill/use-queue-pill-shown";
import { proposalOf, useDuelStore, waitingQueueOf } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";

// The search folded, floating bottom right over any page of the tab that joined the Queue, out of
// the frame whose sidebar fades while a Run is typed. Annuler leaves the Queue without changing
// page: the Run under it goes on. A Match proposal turns it to its answers.
export const QueuePill = () => {
  const shown = useQueuePillShown();
  const setPlay = usePlayStore((state) => state.setPlay);
  const queue = useDuelStore((store) => waitingQueueOf(store.state));

  const proposal = useDuelStore((store) => proposalOf(store.state));

  if (!shown) {
    return null;
  }

  return proposal === null ? (
    <QueuePillCard queue={queue} onCancel={() => setPlay("solo")} />
  ) : (
    <QueuePillProposal proposal={proposal} />
  );
};
