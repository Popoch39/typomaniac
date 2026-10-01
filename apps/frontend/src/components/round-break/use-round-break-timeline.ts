import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

import { reducedMotion, useForcedReducedMotion } from "@/components/motion/reduced-motion-context";
import { GO_AT, roundBreakTimeline } from "@/components/round-break/round-break-timeline";
import { roundMorphFor } from "@/components/round-break/round-morph";
import { slideFromMorph } from "@/components/round-break/round-morph-timeline";
import { useClock } from "@/components/run/clock-context";

gsap.registerPlugin(useGSAP);

// Plays the Round break inside `scope` on the Duel's clock: on every tick, its timeline is sought
// to the time since its start, the GO landing on `startsAt`, the next Round's start. Joined
// halfway (a resume), it is at the right moment at once. Come from the Round just played, its
// header comes out of the HUD's band, in its own time; otherwise it fades in.
export const useRoundBreakTimeline = (scope: RefObject<HTMLElement | null>, startsAt: number) => {
  const clock = useClock();
  const forcedReduced = useForcedReducedMotion();

  useGSAP(
    () => {
      const screen = scope.current;
      const head = screen?.querySelector<HTMLElement>("[data-round-head]") ?? null;
      const morph = screen ? roundMorphFor("into-break", screen) : null;
      const reduced = reducedMotion(forcedReduced);
      const timeline = roundBreakTimeline({ reduced, withHead: morph === null || head === null });
      const origin = startsAt - GO_AT * 1000;
      const unslide = morph && head ? slideFromMorph(head, morph, reduced) : null;

      const sync = () => {
        const at = (clock() - origin) / 1000;

        timeline.time(Math.max(0, Math.min(at, timeline.duration())));
      };

      sync();
      gsap.ticker.add(sync);

      return () => {
        gsap.ticker.remove(sync);
        unslide?.();
      };
    },
    { scope, dependencies: [clock, startsAt, forcedReduced], revertOnUpdate: true },
  );
};
