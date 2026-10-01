import { useEffect } from "react";

import {
  forgetRoundMorphs,
  recordIntoBreak,
  recordIntoRound,
} from "@/components/round-break/round-morph";
import { useDuelStore } from "@/stores/duel-store";

// While the Duel is shown: as a Round ends without deciding the Duel, its HUD's band and its Text
// are recorded before React takes them off for the Round break, whose header comes out of the
// band; at the GO, the header and the next Round's card are recorded for the HUD's band to come
// out of the header. A store's listener runs as the message arrives, or on the frame of the GO.
// What an earlier Duel left is forgotten first.
export const useRoundMorphRecorder = () =>
  useEffect(() => {
    forgetRoundMorphs();

    return useDuelStore.subscribe(({ state }, previous) => {
      const was = previous.state.phase;

      if (state.phase === "round-break" && (was === "running" || was === "finishing")) {
        recordIntoBreak();
      } else if (was === "round-break" && state.phase === "running") {
        recordIntoRound();
      }
    });
  }, []);
