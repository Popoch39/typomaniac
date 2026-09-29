import { QueueCard } from "@/components/duel/queue-card";
import { QueueRing } from "@/components/duel/queue-ring";
import { QueueWait } from "@/components/duel/queue-wait";
import { Button } from "@/components/ui/button";
import type { QueueView } from "@/stores/duel-store";

type QueueSearchProps = {
  // Null until the server tells how the Queue stands.
  queue: QueueView | null;
  onCancel: () => void;
};

// The search for an opponent: the ring, the format, the wait, and Annuler.
export const QueueSearch = ({ queue, onCancel }: QueueSearchProps) => (
  <QueueCard
    title="On te trouve un adversaire…"
    subtitle="Duel classé · 30 s · anglais"
    before={<QueueRing />}
  >
    <output aria-live="polite" className="min-h-8">
      {queue === null ? null : <QueueWait queue={queue} />}
    </output>
    <Button variant="secondary" size="lg" onClick={onCancel}>
      Annuler
    </Button>
  </QueueCard>
);
