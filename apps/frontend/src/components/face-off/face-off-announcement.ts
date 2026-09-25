import { COUNT_MS } from "@/components/face-off/face-off-timeline";
import { atHandle } from "@/lib/at-handle";

// What screen readers hear of the Countdown, `elapsed` ms into the Duel (negative before the
// start): the opponent during the Face-off, then each second of the 3-2-1, then the start.
export const faceOffAnnouncement = (elapsed: number, opponentHandle: string) => {
  if (elapsed < -COUNT_MS) {
    return `Duel contre ${atHandle(opponentHandle)}`;
  }

  return elapsed < 0 ? String(Math.ceil(-elapsed / 1000)) : "Partez !";
};
