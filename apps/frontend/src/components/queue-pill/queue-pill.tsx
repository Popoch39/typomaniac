import { useState } from "react";

import { QueuePillCard } from "@/components/queue-pill/queue-pill-card";
import { QueuePillProposal } from "@/components/queue-pill/queue-pill-proposal";
import { useQueuePillShown } from "@/components/queue-pill/use-queue-pill-shown";
import { proposalOf, type QueueView, useDuelStore, waitingQueueOf } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";

// The search folded, floating bottom right over any page of the tab that joined the Queue, out of
// the frame whose sidebar fades while a Run is typed. Annuler leaves the Queue at once, without
// changing page: the Run under it goes on, and the pill fades out where it was, as it was. A Match
// proposal turns it to its answers.
export const QueuePill = () => {
  const shown = useQueuePillShown();
  const setPlay = usePlayStore((state) => state.setPlay);
  const queue = useDuelStore((store) => waitingQueueOf(store.state));
  const proposal = useDuelStore((store) => proposalOf(store.state));
  // The Queue the pill showed as Annuler left it, while it fades out.
  const [left, setLeft] = useState<{ queue: QueueView | null } | null>(null);

  const cancel = () => {
    setLeft({ queue });
    setPlay("solo");
  };

  if (!shown) {
    return left === null ? null : (
      <QueuePillCard queue={left.queue} onCancel={cancel} onGone={() => setLeft(null)} />
    );
  }

  return proposal === null ? (
    <QueuePillCard queue={queue} onCancel={cancel} />
  ) : (
    <QueuePillProposal proposal={proposal} />
  );
};
