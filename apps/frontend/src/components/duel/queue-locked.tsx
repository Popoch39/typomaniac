import { QueueCard } from "@/components/duel/queue-card";
import { QueueLockButton } from "@/components/duel/queue-lock-button";
import { useSearchDuel } from "@/components/duel/use-search-duel";
import { Button } from "@/components/ui/button";

type QueueLockedProps = {
  // The end of the Queue lock, on the tab's clock.
  until: number;
  onSolo: () => void;
};

// The Queue refused during a Queue lock, in the search's card: Chercher un Duel opens again on its
// own once the lock is over, and joins the Queue on a click. The Friends are still there to
// challenge meanwhile, in the sidebar.
export const QueueLocked = ({ until, onSolo }: QueueLockedProps) => {
  const searchDuel = useSearchDuel();

  return (
    <QueueCard
      title="Queue bloquée"
      subtitle="Tu pourras relancer la recherche à la fin du compte à rebours. Tu peux toujours défier un Friend."
    >
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onSolo}>
          Retour au Solo
        </Button>
        <QueueLockButton lockedUntil={until} onClick={searchDuel} size="lg">
          Chercher un Duel
        </QueueLockButton>
      </div>
    </QueueCard>
  );
};
