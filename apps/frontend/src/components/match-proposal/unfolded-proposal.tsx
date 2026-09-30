import { MatchProposalCard } from "@/components/match-proposal/match-proposal-card";
import { useProposalAnswers } from "@/components/match-proposal/use-proposal-answers";
import type { ProposalView } from "@/stores/duel-store";

// The Match proposal in the search unfolded on Jouer, in place of the search.
export const UnfoldedProposal = ({ proposal }: { proposal: ProposalView }) => {
  const answers = useProposalAnswers();

  return <MatchProposalCard proposal={proposal} bridged {...answers} />;
};
