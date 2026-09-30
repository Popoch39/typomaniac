import { Link } from "@tanstack/react-router";
import { KeyboardIcon } from "lucide-react";

import { queueDuelFormatLine } from "@/components/duel/duel-format-line";
import { QueueCard } from "@/components/duel/queue-card";
import { QueueRing } from "@/components/duel/queue-ring";
import { QueueWait } from "@/components/duel/queue-wait";
import { RUN_PATH } from "@/components/play/play-paths";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { QueueView } from "@/stores/duel-store";

type QueueSearchProps = {
  // Null until the server tells how the Queue stands.
  queue: QueueView | null;
  onCancel: () => void;
};

// The search for an opponent: the ring, the format, the wait, S'entraîner, which folds it into the
// Queue pill for a Run on the last settings, and Annuler.
export const QueueSearch = ({ queue, onCancel }: QueueSearchProps) => {
  const locale = useLocale();

  return (
    <QueueCard
      title={m.queue_search_title({}, { locale })}
      subtitle={queueDuelFormatLine(locale)}
      before={<QueueRing />}
    >
      <output aria-live="polite" className="min-h-8">
        {queue === null ? null : <QueueWait queue={queue} />}
      </output>
      <div className="flex gap-3">
        <Button
          size="lg"
          nativeButton={false}
          render={<Link to={RUN_PATH} />}
          className="rounded-full px-6"
        >
          <KeyboardIcon aria-hidden className="size-5" />
          {m.queue_train({}, { locale })}
        </Button>
        <Button variant="secondary" size="lg" onClick={onCancel} className="rounded-full px-6">
          {m.queue_cancel({}, { locale })}
        </Button>
      </div>
    </QueueCard>
  );
};
