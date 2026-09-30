import { Link } from "@tanstack/react-router";
import { Maximize2Icon, XIcon } from "lucide-react";
import { useId } from "react";

import { QueueRing } from "@/components/duel/queue-ring";
import { PLAY_PATH } from "@/components/play/play-paths";
import { QueuePillWait } from "@/components/queue-pill/queue-pill-wait";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { QueueView } from "@/stores/duel-store";

type QueuePillCardProps = {
  // Null until the server tells how the Queue stands.
  queue: QueueView | null;
  onCancel: () => void;
};

// The Queue pill, 392 × 96 px, named by its title: the ring and the avatar, since when the User
// waits and the Estimated wait, then Agrandir, back to Jouer with the search unfolded, and Annuler.
export const QueuePillCard = ({ queue, onCancel }: QueuePillCardProps) => {
  const locale = useLocale();
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="fixed right-6 bottom-6 z-40 flex h-24 w-98 items-center gap-4 rounded-[30px] bg-surface-2 pr-4 pl-5 shadow-[0_22px_56px_rgb(0_0_0/0.6)] inset-ring inset-ring-foreground/10"
    >
      <QueueRing compact />
      <div className="flex min-w-0 flex-1 flex-col leading-[1.3]">
        <h2 id={titleId} className="text-[15px] font-semibold">
          {m.queue_pill_title({}, { locale })}
        </h2>
        {queue === null ? null : <QueuePillWait queue={queue} />}
      </div>
      <Button
        variant="ghost"
        size="icon"
        nativeButton={false}
        render={<Link to={PLAY_PATH} />}
        aria-label={m.queue_pill_expand({}, { locale })}
        className="rounded-full bg-foreground/8 hover:bg-foreground/14"
      >
        <Maximize2Icon aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCancel}
        aria-label={m.queue_pill_cancel({}, { locale })}
        className="rounded-full bg-foreground/8 hover:bg-foreground/14"
      >
        <XIcon aria-hidden />
      </Button>
    </section>
  );
};
