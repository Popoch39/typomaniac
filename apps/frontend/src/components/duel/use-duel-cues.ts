import { useEffect, useState } from "react";

import type { DuelCues } from "@/components/duel-hud/duel-hud-model";
import { type KeystrokeCues, onCues, onOpponentCues } from "@/lib/cue-bus";

// The Cues heard in one Duel.
type HeardCues = DuelCues & { duelId: string };

const heardIn = (duelId: string): HeardCues => ({ duelId, self: [], opponent: [] });

// The Cues of both sides' Keystrokes in the Duel `duelId`, as the bus hands them out while it is
// shown: what the HUD's effects play (ADR 0010). The Keystrokes a resync or a resume replays send
// none. Keystrokes that caused nothing are left out.
export const useDuelCues = (duelId: string): DuelCues => {
  const [heard, setHeard] = useState(() => heardIn(duelId));

  useEffect(() => {
    const hear = (side: keyof DuelCues) => (keystroke: KeystrokeCues) => {
      if (keystroke.cues.length === 0) {
        return;
      }

      setHeard((current) => {
        const duel = current.duelId === duelId ? current : heardIn(duelId);

        return { ...duel, [side]: [...duel[side], keystroke] };
      });
    };

    const stopOwn = onCues(hear("self"));
    const stopOpponent = onOpponentCues(hear("opponent"));

    return () => {
      stopOwn();
      stopOpponent();
    };
  }, [duelId]);

  return heard.duelId === duelId ? heard : heardIn(duelId);
};
