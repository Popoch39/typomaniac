import { useLocation } from "@tanstack/react-router";

import { DUEL_PATH } from "@/components/duel/duel-path";
import { useInDuel } from "@/components/duel/use-in-duel";
import { PLAY_PATH } from "@/components/play/play-paths";
import { useDuelStore } from "@/stores/duel-store";

// The search is folded: this tab searches the Queue (Lancer la recherche), or answers the Match
// proposal it found, and the page is not Jouer, where it is unfolded, nor the Duel's. Another tab
// of the same User has no Queue pill: its place is elsewhere.
export const useQueuePillShown = () => {
  const inDuel = useInDuel();

  const offJouer = useLocation({
    select: (location) => location.pathname !== PLAY_PATH && location.pathname !== DUEL_PATH,
  });

  const searching = useDuelStore(
    (store) =>
      store.state.phase === "connecting" ||
      store.state.phase === "queued" ||
      store.state.phase === "proposed",
  );

  return inDuel && offJouer && searching;
};
