import { MatchProposal } from "@/components/match-proposal/match-proposal";
import { useDuelStore } from "@/stores/duel-store";

// The Match proposal of the Queue held in this tab, above the pages: it opens on whatever page the
// User is on.
export const QueueProposal = () => {
  const proposal = useDuelStore((store) =>
    store.state.phase === "proposed" ? store.state.proposal : null,
  );

  return proposal === null ? null : <MatchProposal proposal={proposal} />;
};
