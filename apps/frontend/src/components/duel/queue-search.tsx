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
  <section
    aria-labelledby="queue-title"
    className="flex flex-col items-center justify-center gap-6 rounded-card bg-card p-8"
  >
    <QueueRing />
    <div className="flex flex-col gap-1.5 text-center">
      <h2 id="queue-title" className="text-3xl font-extrabold">
        On te trouve un adversaire…
      </h2>
      <p className="text-muted-foreground">Duel classé · 30 s · anglais</p>
    </div>
    <output aria-live="polite" className="min-h-8">
      {queue === null ? null : <QueueWait queue={queue} />}
    </output>
    <Button variant="secondary" size="lg" onClick={onCancel}>
      Annuler
    </Button>
  </section>
);
