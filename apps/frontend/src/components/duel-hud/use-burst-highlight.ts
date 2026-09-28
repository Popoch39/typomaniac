import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useRef } from "react";

import { BOARD_EASE } from "@/components/duel-hud/board-ease";

gsap.registerPlugin(useGSAP);

// How long the highlight takes to move from one Burst's word to the next, in seconds, on the
// curve of the board's CSS transition.
const HIGHLIGHT = 0.3;

// The word of this User's last Burst: each time a new Burst moves the highlight, it comes in on
// the new word and fades out of the word before, if still on the rows shown; at once under
// reduced motion.
export const useBurstHighlight = (
  textRef: RefObject<HTMLDivElement | null>,
  lastBurst: number | null,
) => {
  const highlighted = useRef(lastBurst);

  useGSAP(
    () => {
      const before = highlighted.current;

      highlighted.current = lastBurst;

      const word = textRef.current?.querySelector("[data-burst]") ?? null;

      const wordBefore =
        before === null || before === lastBurst
          ? null
          : (textRef.current?.querySelector(`[data-word="${before}"]`) ?? null);

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const tween = { duration: HIGHLIGHT, ease: BOARD_EASE };

        if (word !== null) {
          gsap.fromTo(word, { "--burst": 0 }, { "--burst": 1, ...tween });
        }

        if (wordBefore !== null) {
          gsap.fromTo(wordBefore, { "--burst": 1 }, { "--burst": 0, ...tween });
        }
      });
    },
    { scope: textRef, dependencies: [lastBurst], revertOnUpdate: true },
  );
};
