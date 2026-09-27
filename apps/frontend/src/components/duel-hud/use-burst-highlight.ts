import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP);

// How long the highlight of a new Burst takes to come in, in seconds.
const HIGHLIGHT_IN = 0.3;

// The word of this User's last Burst: its highlight comes in each time a new Burst moves it, at
// once under reduced motion.
export const useBurstHighlight = (
  textRef: RefObject<HTMLDivElement | null>,
  lastBurst: number | null,
) => {
  useGSAP(
    () => {
      const word = textRef.current?.querySelector("[data-burst]");

      if (lastBurst === null || word === null || typeof word === "undefined") {
        return;
      }

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          word,
          { "--burst": 0 },
          { "--burst": 1, duration: HIGHLIGHT_IN, ease: "power1.out" },
        );
      });
    },
    { scope: textRef, dependencies: [lastBurst], revertOnUpdate: true },
  );
};
