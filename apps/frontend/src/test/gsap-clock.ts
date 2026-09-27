import { act } from "@testing-library/react";
import { gsap } from "gsap";

// GSAP's clock, taken off the ticker and moved by the test: every tween and timeline created
// meanwhile only moves when the test says, callbacks included. `release` gives it back.
export const holdGsapClock = () => {
  let now = gsap.globalTimeline.time();

  gsap.ticker.remove(gsap.updateRoot);

  return {
    // Moves every animation `seconds` on, in steps of a frame, as the ticker would.
    advance: (seconds: number) =>
      act(() => {
        const end = now + seconds;

        while (now < end) {
          now = Math.min(end, now + 1 / 60);
          gsap.updateRoot(now);
        }
      }),
    release: () => gsap.ticker.add(gsap.updateRoot),
  };
};
