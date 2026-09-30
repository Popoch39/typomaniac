import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

import { PILL_CANCEL_SECONDS } from "@/components/search-morph/search-morph-timing";

gsap.registerPlugin(useGSAP);

// Once `onGone` is given (Annuler), the Queue pill in `pillRef` fades out where it is, from how it
// stands, even halfway through folding, then `onGone`; at once under reduced motion.
export const usePillCancelFade = (
  pillRef: RefObject<HTMLElement | null>,
  onGone: (() => void) | undefined,
) => {
  const leaving = onGone !== undefined;

  useGSAP(
    () => {
      if (onGone === undefined) {
        return;
      }

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", onGone);
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(pillRef.current, {
          autoAlpha: 0,
          scale: 0.96,
          duration: PILL_CANCEL_SECONDS,
          ease: "power1.out",
          onComplete: onGone,
        });
      });
    },
    { dependencies: [leaving], scope: pillRef },
  );
};
