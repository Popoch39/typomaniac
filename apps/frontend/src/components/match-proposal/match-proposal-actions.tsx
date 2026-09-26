import type { Ref } from "react";
import { CheckIcon } from "lucide-react";

import { REQUEUE_SECONDS } from "@/components/match-proposal/match-proposal-copy";
import { Button } from "@/components/ui/button";
import type { ProposalStage } from "@/stores/duel-store";

export type MatchProposalHandlers = {
  onAccept: () => void;
  onDecline: () => void;
  // Back to the Queue: after leaving it, or at once when the opponent was at fault.
  onSearchAgain: () => void;
  onSolo: () => void;
};

type MatchProposalActionsProps = MatchProposalHandlers & {
  stage: ProposalStage;
  opponent: string;
  acceptRef: Ref<HTMLButtonElement>;
};

// The mock-up's actions: 56px tall, rounder than the app's buttons.
const ACTION = "h-14 gap-2.5 rounded-2xl";

const PRIMARY = `${ACTION} text-[1.0625rem] font-extrabold`;

const SECONDARY = `${ACTION} bg-muted text-base font-bold`;

const KEY = "rounded-md px-1.75 py-0.75 font-mono text-[0.6875rem] font-medium";

// What the User can do at each stage: decline (Échap) or accept (Entrée) while it is theirs to
// answer, wait for the opponent, go to the Face-off; once out of the Queue, search again or go back
// to Solo; once the opponent was at fault, search again without waiting for the server to.
export const MatchProposalActions = ({
  stage,
  opponent,
  acceptRef,
  onAccept,
  onDecline,
  onSearchAgain,
  onSolo,
}: MatchProposalActionsProps) => {
  switch (stage) {
    case "pending":
      return (
        <div className="grid w-full grid-cols-[1fr_1.6fr] gap-3">
          <Button variant="secondary" onClick={onDecline} className={SECONDARY}>
            Refuser
            <kbd className={`${KEY} bg-card text-muted-foreground`}>Échap</kbd>
          </Button>
          <Button
            ref={acceptRef}
            onClick={onAccept}
            className={`${PRIMARY} shadow-[0_10px_30px_-8px_var(--brand)]`}
          >
            Accepter
            <kbd className={`${KEY} bg-primary-foreground/18`}>Entrée</kbd>
          </Button>
        </div>
      );
    case "accepted":
      return (
        <div className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-muted text-[0.9375rem] font-semibold text-muted-foreground">
          <span
            aria-hidden
            className="size-4 rounded-full border-[2.5px] border-primary border-t-transparent motion-safe:animate-spin"
          />
          En attente de {opponent}…
        </div>
      );
    case "ready":
      return (
        <div className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary text-[1.0625rem] font-extrabold text-primary-foreground">
          <CheckIcon aria-hidden className="size-4.5" strokeWidth={3} />
          Au Face-off
        </div>
      );
    case "opponent-declined":
    case "opponent-missed":
      return (
        <div className="flex w-full flex-col gap-2.5">
          <Button onClick={onSearchAgain} className={PRIMARY}>
            Reprendre la recherche
          </Button>
          <p className="text-center text-[0.8125rem] text-muted-foreground">
            Reprise automatique dans{" "}
            <span className="font-mono text-foreground">{REQUEUE_SECONDS} s</span>
          </p>
        </div>
      );
    case "declined":
    case "missed":
      return (
        <div className="grid w-full grid-cols-[1fr_1.6fr] gap-3">
          <Button variant="secondary" onClick={onSolo} className={SECONDARY}>
            Retour au Solo
          </Button>
          <Button onClick={onSearchAgain} className={PRIMARY}>
            Relancer la recherche
          </Button>
        </div>
      );
  }
};
