import { QueueCard } from "@/components/duel/queue-card";
import {
  MatchProposalActions,
  type MatchProposalHandlers,
} from "@/components/match-proposal/match-proposal-actions";
import { proposalHeadline } from "@/components/match-proposal/match-proposal-copy";
import { MatchProposalPlayers } from "@/components/match-proposal/match-proposal-players";
import { useLocale } from "@/locale/use-locale";
import type { ProposalView } from "@/stores/duel-store";

type MatchProposalCardProps = MatchProposalHandlers & {
  proposal: ProposalView;
  // The search's card on Jouer: the Duel's bridge takes it over as the Duel is found.
  bridged?: boolean;
};

// The search's card carrying the Match proposal, ringed in the accent: what the stage says, both
// players with the time left between them, then what the User can do.
export const MatchProposalCard = ({
  proposal,
  bridged = false,
  ...handlers
}: MatchProposalCardProps) => {
  const locale = useLocale();
  const { stage, opponent, dodgeLock, queueLock } = proposal;
  const headline = proposalHeadline(stage, opponent.handle, locale, queueLock);

  return (
    <QueueCard accent bridged={bridged} title={headline.title} subtitle={headline.subtitle}>
      <MatchProposalPlayers proposal={proposal} />
      <MatchProposalActions
        stage={stage}
        opponent={opponent.handle}
        dodgeLock={dodgeLock}
        queueLockedUntil={queueLock?.until ?? null}
        {...handlers}
      />
    </QueueCard>
  );
};
