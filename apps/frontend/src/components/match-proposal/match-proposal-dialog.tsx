import { Dialog } from "@base-ui/react/dialog";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";

import { meQueryOptions } from "@/api/me";
import {
  MatchProposalActions,
  type MatchProposalHandlers,
} from "@/components/match-proposal/match-proposal-actions";
import { MatchProposalAnnouncer } from "@/components/match-proposal/match-proposal-announcer";
import {
  opponentStatus,
  proposalHeadline,
  selfStatus,
} from "@/components/match-proposal/match-proposal-copy";
import { MatchProposalHeader } from "@/components/match-proposal/match-proposal-header";
import { MatchProposalPlayer } from "@/components/match-proposal/match-proposal-player";
import { MatchProposalRing } from "@/components/match-proposal/match-proposal-ring";
import { useAcceptOnEnter } from "@/components/match-proposal/use-accept-on-enter";
import { useSecondsLeft } from "@/components/match-proposal/use-seconds-left";
import type { ProposalView } from "@/stores/duel-store";

type MatchProposalDialogProps = MatchProposalHandlers & {
  proposal: ProposalView;
  // Over the Queue, the dialog holds the focus. Over the Countdown (« C'est parti ! »), it leaves
  // it to the typing area, which needs it at GO.
  modal?: boolean;
};

// Closing is not the User's to do: the server ends the Match proposal.
const stayOpen = () => {};

// The Match proposal over the page, as in the Match found mock-up: the format and what the stage
// says, both players with the time left between them, then what the User can do. Entrée accepts,
// and the focus goes to Accepter.
export const MatchProposalDialog = ({
  proposal,
  modal = true,
  onAccept,
  onSearchAgain,
  onSolo,
}: MatchProposalDialogProps) => {
  const { data: me } = useQuery(meQueryOptions);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const left = useSecondsLeft(proposal.expiresAt);
  const { stage, opponent } = proposal;
  const headline = proposalHeadline(stage, opponent.handle, proposal.selfAccepted);

  useAcceptOnEnter(stage === "pending", onAccept);

  return (
    <Dialog.Root open modal={modal} onOpenChange={stayOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-background/78 backdrop-blur-sm max-lg:hidden" />
        <Dialog.Popup
          initialFocus={modal ? acceptRef : false}
          finalFocus={false}
          className="fixed top-1/2 left-1/2 z-[60] flex w-160 -translate-1/2 flex-col items-center gap-7 rounded-card bg-card px-10 pt-9 pb-8 shadow-[0_40px_120px_rgb(0_0_0/0.55),inset_0_0_0_1px_color-mix(in_oklch,var(--text)_8%,transparent)] outline-none max-lg:hidden motion-safe:animate-proposal-pop"
        >
          <MatchProposalHeader title={headline.title} subtitle={headline.subtitle} />
          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4">
            <MatchProposalPlayer
              self
              handle={me?.handle ?? ""}
              image={me?.image ?? null}
              rank={proposal.selfRank}
              status={selfStatus(stage, proposal.selfAccepted)}
            />
            <MatchProposalRing stage={stage} secondsLeft={left} />
            <MatchProposalPlayer
              handle={opponent.handle}
              image={opponent.image}
              rank={proposal.opponentRank}
              status={opponentStatus(stage, proposal.opponentAccepted)}
            />
          </div>
          <MatchProposalActions
            stage={stage}
            opponent={opponent.handle}
            acceptRef={acceptRef}
            onAccept={onAccept}
            onSearchAgain={onSearchAgain}
            onSolo={onSolo}
          />
          <MatchProposalAnnouncer stage={stage} opponent={opponent.handle} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
