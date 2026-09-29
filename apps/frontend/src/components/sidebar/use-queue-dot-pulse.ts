import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP);

// How long the dot takes to shrink and fade, then as long to come back, in seconds.
const PULSE_SECONDS = 0.9;

// The dot of the Queue's wait pulses forever, in transforms and opacity only: it shrinks and fades,
// then comes back. Still under reduced motion; killed on unmount.
export const useQueueDotPulse = (dotRef: RefObject<HTMLSpanElement | null>) => {
  useGSAP(
    () => {
      const dot = dotRef.current;

      if (dot === null) {
        return;
      }

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(dot, {
          scale: 0.6,
          opacity: 0.4,
          duration: PULSE_SECONDS,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
    },
    { scope: dotRef },
  );
};
