import { useEffect } from "react";

import { forgetBandMorph, recordBandMorph } from "@/components/duel-end/band-morph";
import { bandSplit } from "@/components/duel-hud/band-lead";
import { duelOf, useDuelStore } from "@/stores/duel-store";

// While the HUD is shown: as the server ends the Duel, its Score band is recorded, split where the
// last Lead put it, before React takes it off for the Duel end, whose band comes out of it. A
// store's listener runs as the message arrives.
// A band left by an earlier Duel is forgotten first.
export const useBandMorphRecorder = () =>
  useEffect(() => {
    forgetBandMorph();

    return useDuelStore.subscribe(({ state }, previous) => {
      const duel = duelOf(previous.state);

      if (state.phase === "ended" && duel !== null) {
        recordBandMorph(bandSplit(duel.score.score - duel.opponentScore.score));
      }
    });
  }, []);
