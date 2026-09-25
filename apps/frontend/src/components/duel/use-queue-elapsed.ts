import { useEffect, useState } from "react";

import { useClock } from "@/components/run/clock-context";

// Milliseconds since `joinedAt`, on the tab's clock, read a few times a second: React skips the
// render while the value stays the same second.
export const useQueueElapsed = (joinedAt: number) => {
  const clock = useClock();
  const [elapsed, setElapsed] = useState(() => clock() - joinedAt);

  useEffect(() => {
    const read = () => setElapsed(Math.floor((clock() - joinedAt) / 1000) * 1000);
    const timer = setInterval(read, 250);

    read();

    return () => clearInterval(timer);
  }, [clock, joinedAt]);

  return elapsed;
};
