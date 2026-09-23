import { useEffect, useState } from "react";

import { useClock } from "@/components/run/clock-context";
import { useRunStore } from "@/stores/run-store";

// Whole seconds left in a `time` Run of `seconds`, counted from its first Keystroke. The clock
// is read on every animation frame, and each frame lets the store end the Run once the time is
// up. Before the first Keystroke nothing runs: the full duration shows.
export const useTimeLeft = (seconds: number) => {
  const clock = useClock();
  const startedAt = useRunStore((state) => state.startedAt);
  const tick = useRunStore((state) => state.tick);
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (startedAt === null) {
      return;
    }

    let frame = 0;

    const onFrame = () => {
      const now = clock();

      // React skips the render while the displayed second stays the same.
      setLeft(Math.max(0, Math.ceil(seconds - (now - startedAt) / 1000)));
      tick(now);
      frame = requestAnimationFrame(onFrame);
    };

    frame = requestAnimationFrame(onFrame);

    return () => cancelAnimationFrame(frame);
  }, [clock, startedAt, seconds, tick]);

  return startedAt === null ? seconds : left;
};
