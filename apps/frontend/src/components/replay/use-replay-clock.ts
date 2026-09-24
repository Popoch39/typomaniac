import { useEffect, useState } from "react";

import {
  pauseReplay,
  type ReplaySpeed,
  replayTime,
  resumeReplay,
  seekReplay,
  setReplaySpeed,
  startReplay,
} from "@/components/replay/replay-clock";
import { useClock } from "@/components/run/clock-context";

// The Replay's time `t`, in ms from 0 to `duration`, playing from the mount on at 1×. The injected
// clock is read on every animation frame while it plays; paused or at the end, nothing runs.
export const useReplayClock = (duration: number) => {
  const clock = useClock();
  const [replay, setReplay] = useState(() => startReplay(clock()));
  const [now, setNow] = useState(clock);
  const t = replayTime(replay, now, duration);
  const ended = t >= duration;
  const playing = replay.since !== null && !ended;

  useEffect(() => {
    if (!playing) {
      return;
    }

    let frame = 0;

    const onFrame = () => {
      setNow(clock());
      frame = requestAnimationFrame(onFrame);
    };

    frame = requestAnimationFrame(onFrame);

    return () => cancelAnimationFrame(frame);
  }, [clock, playing]);

  // Every action reads the clock once, for the Replay and the time it shows.
  const updateNow = (next: (current: typeof replay, time: number) => typeof replay) => {
    const time = clock();

    setNow(time);
    setReplay((current) => next(current, time));
  };

  return {
    t,
    playing,
    ended,
    speed: replay.speed,
    pause: () => updateNow((current, time) => pauseReplay(current, time, duration)),
    resume: () => updateNow(resumeReplay),
    restart: () => updateNow((current, time) => startReplay(time, current.speed)),
    seek: (target: number) => updateNow((current, time) => seekReplay(current, time, target)),
    setSpeed: (speed: ReplaySpeed) =>
      updateNow((current, time) => setReplaySpeed(current, time, duration, speed)),
  };
};
