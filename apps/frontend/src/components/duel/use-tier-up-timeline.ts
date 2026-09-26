import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

import { tierUpTimeline } from "@/components/duel/tier-up-timeline";

gsap.registerPlugin(useGSAP);

// Plays the celebration inside `scope` once, on mount; reverted on unmount. Under reduced motion,
// nothing moves: the celebration shows as it ends.
export const useTierUpTimeline = (scope: RefObject<HTMLDivElement | null>) => {
  useGSAP(
    () => {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        tierUpTimeline();
      }
    },
    { scope },
  );
};
