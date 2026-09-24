import { useEffect, useState } from "react";

import { useClock } from "@/components/run/clock-context";
import { useDuelStore } from "@/stores/duel-store";

// What the Countdown, the time left and the opponent's wpm need: a tenth of a second.
const STEP_MS = 100;

// Milliseconds since the start of the Duel, negative during the Countdown, in steps of STEP_MS.
// The clock is read on every animation frame, and each frame lets the store start and end the
// Duel; React skips the render while the step stays the same.
export const useDuelElapsed = (startsAt: number) => {
  const clock = useClock();
  const tick = useDuelStore((store) => store.tick);
  const [elapsed, setElapsed] = useState(() => clock() - startsAt);

  useEffect(() => {
    let frame = 0;

    const onFrame = () => {
      const now = clock();

      setElapsed(Math.floor((now - startsAt) / STEP_MS) * STEP_MS);
      tick(now);
      frame = requestAnimationFrame(onFrame);
    };

    frame = requestAnimationFrame(onFrame);

    return () => cancelAnimationFrame(frame);
  }, [clock, startsAt, tick]);

  return elapsed;
};
