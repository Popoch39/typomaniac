import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

import { useClock } from "@/components/run/clock-context";

gsap.registerPlugin(useGSAP);

// Builds an effect's paused timeline, or null for none.
type EffectTimeline = (reducedMotion: boolean) => gsap.core.Timeline | null;

// Plays an effect of a Cue on the Duel's clock, `startsAt` being GO on it and `at` the effect's
// Keystroke, in ms since GO: its timeline is built again for each new effect, and sought on every
// tick to the time since `at`, so it stands where the Duel does and freezes with it. Nothing
// while `at` is null. Never through a re-render.
export const useCueTimeline = (
  scope: RefObject<Element | null>,
  { at, startsAt }: { at: number | null; startsAt: number },
  build: EffectTimeline,
) => {
  const clock = useClock();

  useGSAP(
    () => {
      if (at === null) {
        return;
      }

      gsap.matchMedia().add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          still: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const timeline = build(context.conditions?.motion !== true);

          if (timeline === null) {
            return;
          }

          const sync = () => {
            const since = (clock() - startsAt - at) / 1000;

            timeline.time(Math.max(0, Math.min(since, timeline.duration())));
          };

          sync();
          gsap.ticker.add(sync);

          return () => gsap.ticker.remove(sync);
        },
      );
    },
    { scope, dependencies: [clock, startsAt, at], revertOnUpdate: true },
  );
};
