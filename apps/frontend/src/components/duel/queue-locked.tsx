import { QueueLockButton } from "@/components/duel/queue-lock-button";
import { useSearchDuel } from "@/components/duel/use-search-duel";
import { Button } from "@/components/ui/button";

type QueueLockedProps = {
  // The end of the Queue lock, on the tab's clock.
  until: number;
  onSolo: () => void;
};

// The Queue refused during a Queue lock, in place of the search: Chercher un Duel opens again on
// its own once the lock is over, and joins the Queue on a click. The Friends are still there to
// challenge meanwhile.
export const QueueLocked = ({ until, onSolo }: QueueLockedProps) => {
  const searchDuel = useSearchDuel();

  return (
    <section
      aria-labelledby="queue-locked-title"
      className="flex flex-col items-center justify-center gap-6 rounded-card bg-card p-8 text-center"
    >
      <div className="flex flex-col gap-1.5">
        <h2 id="queue-locked-title" className="text-3xl font-extrabold">
          Queue bloquée
        </h2>
        <p className="text-muted-foreground">
          Tu pourras relancer la recherche à la fin du compte à rebours. Tu peux toujours défier un
          Friend.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onSolo}>
          Retour au Solo
        </Button>
        <QueueLockButton lockedUntil={until} onClick={searchDuel} size="lg">
          Chercher un Duel
        </QueueLockButton>
      </div>
    </section>
  );
};
