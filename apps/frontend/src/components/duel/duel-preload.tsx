import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { DUEL_PATH } from "@/components/duel/duel-path";
import { hasPendingChallenge, useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";

// The Duel's page is loaded as soon as a Duel is likely, so the Face-off never waits for its code:
// a Match proposal here, on Jouer or in the Queue pill, and a Challenge sent or received.
export const DuelPreload = () => {
  const router = useRouter();
  const proposed = useDuelStore((store) => store.state.phase === "proposed");

  const challengePending = useConnectionStore(({ challenges }) => hasPendingChallenge(challenges));

  useEffect(() => {
    if (proposed || challengePending) {
      void router.preloadRoute({ to: DUEL_PATH });
    }
  }, [proposed, challengePending, router]);

  return null;
};
