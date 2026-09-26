import { useSearchDuel } from "@/components/duel/use-search-duel";
import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { MatchProposalDialog } from "@/components/match-proposal/match-proposal-dialog";
import { type ProposalView, useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";

// The Match proposal of the Queue, over its screen: accepting (a click or Entrée) lets the
// Face-off sound; once ended without a Duel, back to the Queue (joining it again lets the sound
// too) or to Solo.
export const MatchProposal = ({ proposal }: { proposal: ProposalView }) => {
  const acceptProposal = useDuelStore((store) => store.acceptProposal);
  const declineProposal = useDuelStore((store) => store.declineProposal);
  const setPlay = usePlayStore((state) => state.setPlay);
  const { unlock } = useFaceOffSounds();
  const searchDuel = useSearchDuel();

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
