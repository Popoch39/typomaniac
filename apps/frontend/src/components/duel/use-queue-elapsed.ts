import { useEffect, useState } from "react";

import { type Clock, useClock } from "@/components/run/clock-context";

// Milliseconds since `joinedAt`, on `clock` (the tab's, unless another is given), read a few times
// a second: React skips the render while the value stays the same second.
export const useQueueElapsed = (joinedAt: number, clock?: Clock) => {
  const tabClock = useClock();
  const read = clock ?? tabClock;
  const [elapsed, setElapsed] = useState(() => read() - joinedAt);

  useEffect(() => {
    const update = () => setElapsed(Math.floor((read() - joinedAt) / 1000) * 1000);
    const timer = setInterval(update, 250);

    update();

    return () => clearInterval(timer);
  }, [read, joinedAt]);

  return elapsed;
};
