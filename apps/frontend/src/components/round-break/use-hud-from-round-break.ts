import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

import { reducedMotion, useForcedReducedMotion } from "@/components/motion/reduced-motion-context";
import { roundMorphFor } from "@/components/round-break/round-morph";
import { ROUND_MORPH_SECONDS, slideFromMorph } from "@/components/round-break/round-morph-timeline";

gsap.registerPlugin(useGSAP);

// How long the new Round's Text takes to show at the GO, in seconds.
const TEXT_IN_SECONDS = 0.3;

// The HUD inside `scope`, at the GO of a Round after a Round break: its band comes out of the Round
// break's header, the next Round's card fades away and the new Text comes in. Shown any other way
// (the first Round, a resume), it is there at once. Typing is open from the start all the same.
export const useHudFromRoundBreak = (scope: RefObject<HTMLElement | null>) => {
  const forcedReduced = useForcedReducedMotion();

  useGSAP(
    () => {
      const screen = scope.current;
      const band = screen?.querySelector<HTMLElement>("[data-duel-band]") ?? null;
      const text = screen?.querySelector<HTMLElement>("[data-duel-text-card]") ?? null;
      const morph = screen ? roundMorphFor("into-round", screen) : null;

      if (morph === null || band === null) {
        return;
      }

      const reduced = reducedMotion(forcedReduced);
      const unslide = slideFromMorph(band, morph, reduced);

      if (text !== null) {
        // The Text lands with the band.
        gsap.timeline().fromTo(
          text,
          { opacity: 0 },
          {
            opacity: 1,
            duration: TEXT_IN_SECONDS,
            ease: "power1.out",
            lazy: false,
            clearProps: "opacity",
          },
          reduced ? 0 : ROUND_MORPH_SECONDS - TEXT_IN_SECONDS,
        );
      }

      return unslide;
    },
    { scope, dependencies: [forcedReduced] },
  );
};
