import { useId } from "react";

import { Slider } from "@/components/ui/slider";

type ReplayTimelineProps = { t: number; duration: number; onSeek: (target: number) => void };

// Seconds for a screen reader, to the tenth: `3,1 s`.
const seconds = (ms: number) =>
  `${(ms / 1000).toLocaleString("fr", { maximumFractionDigits: 1 })} s`;

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
        getAriaValueText={(_, value) => `${seconds(value)} sur ${seconds(duration)}`}
      />
    </>
  );
};
