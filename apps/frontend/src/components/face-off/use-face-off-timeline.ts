import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useRef } from "react";

import {
  COUNTDOWN_S,
  faceOffTimeline,
  soundsPassed,
} from "@/components/face-off/face-off-timeline";
import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { useClock } from "@/components/run/clock-context";
import { useFaceOffSoundStore } from "@/stores/face-off-sound-store";

gsap.registerPlugin(useGSAP);

// Plays the Face-off inside `scope` on the Duel's clock: on every tick, the timeline is sought to
// the time since the pairing, so it starts at the right place on a resume (the Face-off skipped
// if it is over) and both players see the same second of the 3-2-1. Still once it is over.
// Each label passed plays its sound, unless muted; a sound already played, or passed long ago,
// never plays again, whatever the seek (a `duel-resumed` rebuilds the timeline).
export const useFaceOffTimeline = (
  scope: RefObject<HTMLDivElement | null>,
  startsAt: number,
  // This User's Stake is shown: its bar fills in on the timeline.
  withStake: boolean,
) => {
  const clock = useClock();
  const sounds = useFaceOffSounds();
  // The time since the pairing up to which the sounds were played, kept across the timelines.
  const heard = useRef(Number.NEGATIVE_INFINITY);

  useGSAP(
    () => {
      // Under reduced motion, the Stake's bar shows at once what a win would add.
      const fillStake = withStake && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const timeline = faceOffTimeline({ fillStake });
      const pairedAt = startsAt - COUNTDOWN_S * 1000;

      const sync = () => {
        const at = (clock() - pairedAt) / 1000;
        const passed = soundsPassed(timeline.labels, heard.current, at);

        timeline.time(Math.max(0, Math.min(at, timeline.duration())));
        heard.current = Math.max(heard.current, at);

        if (!useFaceOffSoundStore.getState().muted) {
          for (const sound of passed) {
            sounds.play(sound);
          }
        }

        if (at >= timeline.duration()) {
          gsap.ticker.remove(sync);
        }
      };

      sync();
      gsap.ticker.add(sync);

      return () => gsap.ticker.remove(sync);
    },
    { scope, dependencies: [clock, sounds, startsAt, withStake] },
  );
};
