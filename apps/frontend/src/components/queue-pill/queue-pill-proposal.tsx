import { useProposalAnswers } from "@/components/match-proposal/use-proposal-answers";
import { QueuePillProposalCard } from "@/components/queue-pill/queue-pill-proposal-card";
import type { ProposalView } from "@/stores/duel-store";

// The Match proposal in the search folded: the Queue pill turns to it, on the page the User is on.
export const QueuePillProposal = ({ proposal }: { proposal: ProposalView }) => {
  const answers = useProposalAnswers();

  return <QueuePillProposalCard proposal={proposal} {...answers} />;
};
