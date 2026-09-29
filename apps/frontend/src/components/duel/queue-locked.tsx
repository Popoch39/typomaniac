import { QueueCard } from "@/components/duel/queue-card";
import { QueueLockButton } from "@/components/duel/queue-lock-button";
import { useSearchDuel } from "@/components/duel/use-search-duel";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type QueueLockedProps = {
  // The end of the Queue lock, on the tab's clock.
  until: number;
  onSolo: () => void;
};

// The Queue refused during a Queue lock, in the search's card: Chercher un Duel opens again on its
// own once the lock is over, and joins the Queue on a click. The Friends are still there to
// challenge meanwhile, in the sidebar.
export const QueueLocked = ({ until, onSolo }: QueueLockedProps) => {
  const locale = useLocale();
  const searchDuel = useSearchDuel();

  return (
    <QueueCard
      title={m.queue_locked_title({}, { locale })}
      subtitle={m.queue_locked_pitch({}, { locale })}
    >
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onSolo}>
          {m.queue_back_to_solo({}, { locale })}
        </Button>
        <QueueLockButton lockedUntil={until} onClick={searchDuel} size="lg">
          {m.queue_search_duel({}, { locale })}
        </QueueLockButton>
      </div>
    </QueueCard>
  );
};
