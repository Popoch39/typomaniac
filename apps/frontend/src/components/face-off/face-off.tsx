import { useState } from "react";
import { createPortal } from "react-dom";

import { FaceOffOverlay } from "@/components/face-off/face-off-overlay";
import type { FaceOffPairing } from "@/components/face-off/face-off-pairing";
import { EXIT_MS } from "@/components/face-off/face-off-timeline";
import { useClock } from "@/components/run/clock-context";
import type { DuelOpponent } from "@/stores/duel-store";

type FaceOffProps = {
  opponent: DuelOpponent;
  pairing: FaceOffPairing;
  startsAt: number;
  // Milliseconds since the start of the Duel, negative during the Countdown.
  elapsed: number;
};

// The Face-off overlay from the Countdown to the end of its exit, past the start. A Duel joined
// after its start (a resume) never shows it.
export const FaceOff = ({ opponent, pairing, startsAt, elapsed }: FaceOffProps) => {
  const clock = useClock();
  // Read from the clock: `elapsed` may still be the previous Duel's for a frame.
  const [inCountdown] = useState(() => clock() < startsAt);

  if (!inCountdown || elapsed >= EXIT_MS) {
    return null;
  }

  return createPortal(
    <FaceOffOverlay opponent={opponent} pairing={pairing} startsAt={startsAt} elapsed={elapsed} />,
    document.body,
  );
};
