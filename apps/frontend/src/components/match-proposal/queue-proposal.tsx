import { MatchProposal } from "@/components/match-proposal/match-proposal";
import { proposalOf, useDuelStore } from "@/stores/duel-store";

// The Match proposal of the Queue held in this tab, above the pages: whatever page the User is on,
// it is told and answered with Entrée, while the search's card or Queue pill shows it.
export const QueueProposal = () => {
  const proposal = useDuelStore((store) => proposalOf(store.state));

  return proposal === null ? null : <MatchProposal proposal={proposal} />;
};
