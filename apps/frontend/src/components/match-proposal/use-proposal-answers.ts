import { useSearchDuel } from "@/components/duel/use-search-duel";
import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import type { MatchProposalHandlers } from "@/components/match-proposal/match-proposal-actions";
import { useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";
import { useRunStore } from "@/stores/run-store";

// A Run being typed, or finished, is dropped for a new one: accepting abandons it, without a
// Result, on the way to the Duel.
const abandonRun = () => {
  const run = useRunStore.getState();

  if (run.startedAt !== null) {
    run.next();
  }
};

// What the User can answer a Match proposal, from the search's card or from the Queue pill:
// accepting (a click or Entrée) lets the Face-off sound and abandons the Run; once ended without a
// Duel, back to the Queue (joining it again lets the sound too) or to Solo, on the same page.
export const useProposalAnswers = (): MatchProposalHandlers => {
  const acceptProposal = useDuelStore((store) => store.acceptProposal);
  const declineProposal = useDuelStore((store) => store.declineProposal);
  const setPlay = usePlayStore((state) => state.setPlay);
  const { unlock } = useFaceOffSounds();
  const searchDuel = useSearchDuel();

  return {
    onAccept: () => {
      unlock();
      abandonRun();
      acceptProposal();
    },
    onDecline: declineProposal,
    onSearchAgain: searchDuel,
    onSolo: () => setPlay("solo"),
  };
};
