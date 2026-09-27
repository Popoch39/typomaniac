import { useEffect, useState } from "react";

import { SCRIPTED_LOOP_MS } from "@/components/duel-hud-dev/scripted-moments";
import { useClock } from "@/components/run/clock-context";

// The scripted Duel's clock, in ms since GO: `frozenAt` when frozen on a moment, otherwise played
// in a loop from GO on the injected clock, read on every animation frame.
export const useScriptedTime = (frozenAt: number | null) => {
  const clock = useClock();
  const [loopTime, setLoopTime] = useState(0);

  useEffect(() => {
    if (frozenAt !== null) {
      return;
    }

    const start = clock();
    let frame = 0;

    const onFrame = () => {
      setLoopTime((clock() - start) % SCRIPTED_LOOP_MS);
      frame = requestAnimationFrame(onFrame);
    };

    frame = requestAnimationFrame(onFrame);

    return () => cancelAnimationFrame(frame);
  }, [clock, frozenAt]);

  return frozenAt ?? loopTime;
};
