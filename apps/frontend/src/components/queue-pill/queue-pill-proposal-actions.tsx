import { CheckIcon } from "lucide-react";

import { QueueLockButton } from "@/components/duel/queue-lock-button";
import type { MatchProposalHandlers } from "@/components/match-proposal/match-proposal-actions";
import { dodgeWarning } from "@/components/match-proposal/match-proposal-copy";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { ProposalView } from "@/stores/duel-store";

type QueuePillProposalActionsProps = MatchProposalHandlers & { proposal: ProposalView };

// On the accent: the pill's buttons in its ink, the main one filled with it.
const ACTION = "h-11 flex-1 rounded-full font-bold";

const SECONDARY = `${ACTION} bg-primary-foreground/14 text-primary-foreground hover:bg-primary-foreground/22`;

const PRIMARY = `${ACTION} bg-primary-foreground font-extrabold text-primary hover:bg-primary-foreground/88`;

const KEY =
  "rounded-md bg-primary/18 px-1.5 py-0.5 font-mono text-[0.6875rem] font-medium text-primary";

const NOTE = "flex h-11 items-center justify-center gap-2 text-sm font-semibold";

// What the User can do from the Queue pill, stage by stage, as from the search's card: decline (a
// click only) or accept (Entrée), warned when declining would lock the Queue; wait for the
// opponent; go to the Face-off; once out of the Queue, go back to Solo or search again once the
// lock is over; once the opponent was at fault, search again at once.
export const QueuePillProposalActions = ({
  proposal,
  onAccept,
  onDecline,
  onSearchAgain,
  onSolo,
}: QueuePillProposalActionsProps) => {
  const locale = useLocale();
  const { stage, opponent, dodgeLock, queueLock } = proposal;

  switch (stage) {
    case "pending":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onDecline} className={SECONDARY}>
              {m.proposal_decline({}, { locale })}
            </Button>
            <Button onClick={onAccept} className={PRIMARY}>
              {m.proposal_accept({}, { locale })}
              <kbd className={KEY}>{m.proposal_key_enter({}, { locale })}</kbd>
            </Button>
          </div>
          {dodgeLock === null ? null : (
            <p className="text-center text-[13px] font-semibold">
              {dodgeWarning(dodgeLock, locale)}
            </p>
          )}
        </div>
      );
    case "accepted":
      return (
        <p className={NOTE}>
          <span
            aria-hidden
            className="size-3.5 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
          />
          {m.proposal_waiting_for({ opponent: opponent.handle }, { locale })}
        </p>
      );
    case "ready":
      return (
        <p className={NOTE}>
          <CheckIcon aria-hidden className="size-4" strokeWidth={3} />
          {m.proposal_to_face_off({}, { locale })}
        </p>
      );
    case "opponent-declined":
    case "opponent-missed":
      return (
        <Button onClick={onSearchAgain} className={PRIMARY}>
          {m.proposal_resume_search({}, { locale })}
        </Button>
      );
    case "declined":
    case "missed":
      return (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onSolo} className={SECONDARY}>
            {m.queue_back_to_solo({}, { locale })}
          </Button>
          <QueueLockButton
            lockedUntil={queueLock?.until ?? null}
            onClick={onSearchAgain}
            className={PRIMARY}
          >
            {m.proposal_search_again({}, { locale })}
          </QueueLockButton>
        </div>
      );
  }
};
