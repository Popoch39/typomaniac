import { useEffect, useState } from "react";

import { secondsLeft } from "@/components/match-proposal/match-proposal-copy";
import { useClock } from "@/components/run/clock-context";

// The whole seconds left before `expiresAt` (on the tab's clock), read a few times a second: React
// skips the render while the second stays the same.
export const useSecondsLeft = (expiresAt: number) => {
  const clock = useClock();
  const [left, setLeft] = useState(() => secondsLeft(expiresAt, clock()));

  useEffect(() => {
    const read = () => setLeft(secondsLeft(expiresAt, clock()));
    const timer = setInterval(read, 250);

    read();

    return () => clearInterval(timer);
  }, [clock, expiresAt]);

  return left;
};
