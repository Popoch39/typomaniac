import { useId } from "react";

import { replaySeconds } from "@/components/replay/replay-seconds";
import { Slider } from "@/components/ui/slider";

type ReplayTimelineProps = { t: number; duration: number; onSeek: (target: number) => void };

// The time bar of the Replay: it follows `t`, and moving it, by mouse or arrow keys (a tenth of a
// second, 5 s with Page up / down), goes straight to that instant.
export const ReplayTimeline = ({ t, duration, onSeek }: ReplayTimelineProps) => {
  const labelId = useId();

  return (
    <>
      <span id={labelId} className="sr-only">
        Temps du Replay
      </span>
      <Slider
        aria-labelledby={labelId}
        min={0}
        max={duration}
        step={100}
        largeStep={5_000}
        value={t}
        onValueChange={onSeek}
        getAriaValueText={(_, value) => `${replaySeconds(value)} sur ${replaySeconds(duration)}`}
      />
    </>
  );
};
