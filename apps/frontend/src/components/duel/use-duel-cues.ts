import { useEffect, useState } from "react";

import type { DuelCues } from "@/components/duel-hud/duel-hud-model";
import { type KeystrokeCues, onCues, onOpponentCues } from "@/lib/cue-bus";

// The Cues heard in one Round of a Duel.
type HeardCues = DuelCues & { roundKey: string };

const heardIn = (roundKey: string): HeardCues => ({ roundKey, self: [], opponent: [] });

// The Cues of both sides' Keystrokes in the Round `roundKey` (the Duel's id and the Round's index:
// they are stamped from its start), as the bus hands them out while it is shown: what the HUD's
// effects play (ADR 0010). The Keystrokes a resync or a resume replays send none. Keystrokes that
// caused nothing are left out.
export const useDuelCues = (roundKey: string): DuelCues => {
  const [heard, setHeard] = useState(() => heardIn(roundKey));

  useEffect(() => {
    const hear = (side: keyof DuelCues) => (keystroke: KeystrokeCues) => {
      if (keystroke.cues.length === 0) {
        return;
      }

      setHeard((current) => {
        const round = current.roundKey === roundKey ? current : heardIn(roundKey);

        return { ...round, [side]: [...round[side], keystroke] };
      });
    };

    const stopOwn = onCues(hear("self"));
    const stopOpponent = onOpponentCues(hear("opponent"));

    return () => {
      stopOwn();
      stopOpponent();
    };
  }, [roundKey]);

  return heard.roundKey === roundKey ? heard : heardIn(roundKey);
};
