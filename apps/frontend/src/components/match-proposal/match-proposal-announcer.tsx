import { proposalAnnouncement } from "@/components/match-proposal/match-proposal-copy";
import type { ProposalStage } from "@/stores/duel-store";

// Told to screen readers: the opponent and the time to answer, then each outcome.
export const MatchProposalAnnouncer = ({
  stage,
  opponent,
}: {
  stage: ProposalStage;
  opponent: string;
}) => (
  <output aria-live="assertive" className="sr-only">
    {proposalAnnouncement(stage, opponent)}
  </output>
);
