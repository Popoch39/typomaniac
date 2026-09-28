import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useRef } from "react";

import { BOARD_EASE } from "@/components/duel-hud/board-ease";

gsap.registerPlugin(useGSAP);

// The ink of a pip: full when lit, faint otherwise, none while a broken Combo turns it red.
export const pipTone = ({ lit, broken }: { lit: boolean; broken: boolean }) => {
  if (broken) {
    return 0;
  }

  return lit ? 1 : 0.2;
};

// How long a pip takes to change, in seconds, on the curve of the board's CSS transition.
const TONE = 0.16;

// Fades a pip's ink from its last tone to `tone` whenever it changes, as the board's pips change
// colour: the render sets where it ends, the tween only brings it there. Nothing at first, the
// pip is drawn as it is.
export const usePipTone = (inkRef: RefObject<HTMLElement | null>, tone: number) => {
  const shown = useRef(tone);

  useGSAP(
    () => {
      const ink = inkRef.current;
      const from = shown.current;

      shown.current = tone;

      if (ink === null || from === tone) {
        return;
      }

      gsap.fromTo(
        ink,
        { opacity: from },
        { opacity: tone, duration: TONE, ease: BOARD_EASE, overwrite: true },
      );
    },
    { scope: inkRef, dependencies: [tone] },
  );
};
