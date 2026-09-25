import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

import { COUNTDOWN_S, faceOffTimeline } from "@/components/face-off/face-off-timeline";
import { useClock } from "@/components/run/clock-context";

gsap.registerPlugin(useGSAP);

// Plays the Face-off inside `scope` on the Duel's clock: on every tick, the timeline is sought to
// the time since the pairing, so it starts at the right place on a resume (the Face-off skipped
// if it is over) and both players see the same second of the 3-2-1. Still once it is over.
export const useFaceOffTimeline = (scope: RefObject<HTMLDivElement | null>, startsAt: number) => {
  const clock = useClock();

  useGSAP(
    () => {
      const timeline = faceOffTimeline();
      const pairedAt = startsAt - COUNTDOWN_S * 1000;

      const sync = () => {
        const at = (clock() - pairedAt) / 1000;

        timeline.time(Math.max(0, Math.min(at, timeline.duration())));

        if (at >= timeline.duration()) {
          gsap.ticker.remove(sync);
        }
      };

      sync();
      gsap.ticker.add(sync);

      return () => gsap.ticker.remove(sync);
    },
    { scope, dependencies: [clock, startsAt] },
  );
};
