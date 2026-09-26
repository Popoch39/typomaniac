import { useSearchDuel } from "@/components/duel/use-search-duel";
import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { PROPOSAL_TAB_TITLE } from "@/components/match-proposal/match-proposal-copy";
import { MatchProposalDialog } from "@/components/match-proposal/match-proposal-dialog";
import { useBlinkingTitle } from "@/components/match-proposal/use-blinking-title";
import { useProposalArrival } from "@/components/match-proposal/use-proposal-arrival";
import { type ProposalView, useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";

// The Match proposal of the Queue, over its screen: accepting (a click or Entrée) lets the
// Face-off sound; once ended without a Duel, back to the Queue (joining it again lets the sound
// too) or to Solo. A User looking elsewhere hears it arrive, sees the tab's title blink while it
// waits for an answer, and gets a notification when the tab is hidden.
export const MatchProposal = ({ proposal }: { proposal: ProposalView }) => {
  const acceptProposal = useDuelStore((store) => store.acceptProposal);
  const declineProposal = useDuelStore((store) => store.declineProposal);
  const setPlay = usePlayStore((state) => state.setPlay);
  const { unlock } = useFaceOffSounds();
  const searchDuel = useSearchDuel();

  useProposalArrival(proposal.stage, proposal.opponent.handle);
  useBlinkingTitle(proposal.stage === "pending", PROPOSAL_TAB_TITLE);

  const accept = () => {
    unlock();
    acceptProposal();
  };

  return (
    <MatchProposalDialog
      proposal={proposal}
      onAccept={accept}
      onDecline={declineProposal}
      onSearchAgain={searchDuel}
      onSolo={() => setPlay("solo")}
    />
  );
};
