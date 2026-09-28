import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

import { discTimeline } from "@/components/duel-hud/disc-timeline";
import { useClock } from "@/components/run/clock-context";

gsap.registerPlugin(useGSAP);

type DiscRefs = {
  disc: RefObject<HTMLDivElement | null>;
  ring: RefObject<SVGCircleElement | null>;
};

// Plays the disc on the Duel's clock, `startsAt` being GO on it: on every tick, its timeline is
// sought to the time since GO, so the ring and the beat stand where the Duel does, a resume
// included, and freeze with it. Never through a re-render. No beat under reduced motion.
export const useDiscTimeline = (
  { disc, ring }: DiscRefs,
  { startsAt, seconds }: { startsAt: number; seconds: number },
) => {
  const clock = useClock();

  useGSAP(
    () => {
      const discElement = disc.current;
      const ringElement = ring.current;

      if (discElement === null || ringElement === null) {
        return;
      }

      gsap.matchMedia().add(
        {
          beat: "(prefers-reduced-motion: no-preference)",
          still: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const timeline = discTimeline(discElement, ringElement, {
            seconds,
            beat: context.conditions?.beat === true,
          });

          const sync = () => {
            timeline.time(Math.max(0, Math.min((clock() - startsAt) / 1000, seconds)));
          };

          sync();
          gsap.ticker.add(sync);

          return () => gsap.ticker.remove(sync);
        },
      );
    },
    { scope: disc, dependencies: [clock, startsAt, seconds], revertOnUpdate: true },
  );
};
