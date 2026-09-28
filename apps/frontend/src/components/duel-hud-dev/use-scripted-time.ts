import { useEffect, useRef, useState } from "react";

import { SCRIPTED_LOOP_MS } from "@/components/duel-hud-dev/scripted-moments";
import { type Clock, useClock } from "@/components/run/clock-context";

// The scripted Duel's clock, in ms since GO: `frozenAt` when frozen on a moment, otherwise played
// in a loop from GO on the injected clock, read on every animation frame. `t` is its time at
// this render; `clock` reads it at any moment, for the HUD's timelines sought on every tick.
export const useScriptedTime = (frozenAt: number | null) => {
  const clock = useClock();
  const [loopTime, setLoopTime] = useState(0);
  // When the loop started on the injected clock; null until it does.
  const loopStart = useRef<number | null>(null);

  useEffect(() => {
    if (frozenAt !== null) {
      return;
    }

    loopStart.current = clock();

    let frame = 0;

    const onFrame = () => {
      setLoopTime((clock() - (loopStart.current ?? 0)) % SCRIPTED_LOOP_MS);
      frame = requestAnimationFrame(onFrame);
    };

    frame = requestAnimationFrame(onFrame);

    return () => cancelAnimationFrame(frame);
  }, [clock, frozenAt]);

  const scriptedClock: Clock =
    frozenAt === null
      ? () => (loopStart.current === null ? 0 : (clock() - loopStart.current) % SCRIPTED_LOOP_MS)
      : () => frozenAt;

  return { t: frozenAt ?? loopTime, clock: scriptedClock };
};
