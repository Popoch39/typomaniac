import { useEffect, useState } from "react";

import { framesInLastSecond } from "@/components/aura-gallery/frames-per-second";

// How often the count is shown anew: often enough to follow a scroll, rarely enough to cost
// nothing.
const REFRESH_MS = 250;

// The frames the page drew over the last second, null before the first count. Every frame is
// counted in a local array; the component renders only on refresh.
export const useFramesPerSecond = () => {
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    let frames: number[] = [];
    let shownAt = performance.now();
    let request = 0;

    const onFrame = (now: number) => {
      frames = framesInLastSecond(frames, now);
      frames.push(now);

      if (now - shownAt >= REFRESH_MS) {
        shownAt = now;
        setFps(frames.length);
      }

      request = requestAnimationFrame(onFrame);
    };

    request = requestAnimationFrame(onFrame);

    return () => cancelAnimationFrame(request);
  }, []);

  return fps;
};
