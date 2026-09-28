import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useRef } from "react";

import { BOARD_EASE } from "@/components/duel-hud/board-ease";

gsap.registerPlugin(useGSAP);

// Fades an element's ink from its last tone to `tone` (an opacity) over `seconds` whenever it
// changes, on the curve of the board's CSS transitions, as the board's pips and marks change
// colour: the render sets where it ends, the tween only brings it there. Nothing at first, the
// element is drawn as it is.
export const useInkFade = (
  inkRef: RefObject<HTMLElement | null>,
  tone: number,
  seconds: number,
) => {
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
        { opacity: tone, duration: seconds, ease: BOARD_EASE, overwrite: true },
      );
    },
    { scope: inkRef, dependencies: [tone] },
  );
};
