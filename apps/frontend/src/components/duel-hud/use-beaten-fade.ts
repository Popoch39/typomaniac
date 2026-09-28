import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

import { BOARD_EASE } from "@/components/duel-hud/board-ease";

gsap.registerPlugin(useGSAP);

// How long the loser's half takes to grey, in seconds, on the board's curve, and how much of it
// shows then.
const FADE = 0.3;

const BEATEN_OPACITY = 0.5;

// Greys a player's half of the band once the server says they lost the Duel: to half its opacity,
// over 300 ms. A fade, under reduced motion too. Back as it was once they are not beaten anymore.
export const useBeatenFade = (half: RefObject<HTMLElement | null>, beaten: boolean) => {
  useGSAP(
    () => {
      if (beaten && half.current !== null) {
        gsap.to(half.current, { opacity: BEATEN_OPACITY, duration: FADE, ease: BOARD_EASE });
      }
    },
    { scope: half, dependencies: [beaten], revertOnUpdate: true },
  );
};
