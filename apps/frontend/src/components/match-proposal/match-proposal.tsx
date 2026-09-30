import { proposalTabTitle } from "@/components/match-proposal/match-proposal-copy";
import { MatchProposalAnnouncer } from "@/components/match-proposal/match-proposal-announcer";
import { useAcceptOnEnter } from "@/components/match-proposal/use-accept-on-enter";
import { useBlinkingTitle } from "@/components/match-proposal/use-blinking-title";
import { useProposalAnswers } from "@/components/match-proposal/use-proposal-answers";
import { useProposalArrival } from "@/components/match-proposal/use-proposal-arrival";
import { useLocale } from "@/locale/use-locale";
import type { ProposalView } from "@/stores/duel-store";

// The Match proposal wherever the search is shown, card or Queue pill, which carry it: Entrée
// accepts it from anywhere, a Run being typed included, while no key declines it. A User looking
// elsewhere hears it arrive, sees the tab's title blink while it waits for an answer, and gets a
// notification when the tab is hidden; screen readers are told each stage.
export const MatchProposal = ({ proposal }: { proposal: ProposalView }) => {
  const { onAccept } = useProposalAnswers();
  const locale = useLocale();
  const { stage, opponent, dodgeLock, queueLock } = proposal;

  useProposalArrival(stage, opponent.handle);
  useBlinkingTitle(stage === "pending", proposalTabTitle(locale));
  useAcceptOnEnter(stage === "pending", onAccept);

  return (
    <MatchProposalAnnouncer
      stage={stage}
      opponent={opponent.handle}
      dodgeLock={dodgeLock}
      queueLock={queueLock}
    />
  );
};
