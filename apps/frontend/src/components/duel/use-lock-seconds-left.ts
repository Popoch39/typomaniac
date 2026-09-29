import { useEffect, useState } from "react";

import { type Clock, useClock } from "@/components/run/clock-context";
import { lockSecondsLeft } from "@/lib/queue-lock";

// The whole seconds left of the Queue lock ending at `until` (on the tab's clock, or on `given`
// where the lock is told on another; null without a lock, so none left), read a few times a second
// until it is over: React skips the render while the second stays the same.
export const useLockSecondsLeft = (until: number | null, given?: Clock) => {
  const tabClock = useClock();
  const clock = given ?? tabClock;
  const [left, setLeft] = useState(() => (until === null ? 0 : lockSecondsLeft(until, clock())));

  useEffect(() => {
    if (until === null) {
      return;
    }

    const read = () => {
      const seconds = lockSecondsLeft(until, clock());

      setLeft(seconds);

      if (seconds === 0) {
        clearInterval(timer);
      }
    };

    const timer = setInterval(read, 250);

    read();

    return () => clearInterval(timer);
  }, [clock, until]);

  return until === null ? 0 : left;
};
