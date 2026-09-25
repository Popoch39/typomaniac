import { useId } from "react";

import { Slider } from "@/components/ui/slider";

type FaceOffLabTimelineProps = { t: number; duration: number; onSeek: (target: number) => void };

// The lab's time since the pairing, to the hundredth, and its bar, scrubbed 10 ms at a time.
const labSeconds = (ms: number) =>
  `${(ms / 1000).toLocaleString("fr", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s`;

export const FaceOffLabTimeline = ({ t, duration, onSeek }: FaceOffLabTimelineProps) => {
  const labelId = useId();

  return (
    <>
      <span id={labelId} className="sr-only">
        Temps du Face-off
      </span>
      <span aria-hidden className="w-16 shrink-0 font-mono text-sm tabular-nums">
        {labSeconds(t)}
      </span>
      <Slider
        aria-labelledby={labelId}
        min={0}
        max={duration}
        step={10}
        largeStep={500}
        value={t}
        onValueChange={onSeek}
        getAriaValueText={(_, value) => labSeconds(value)}
      />
    </>
  );
};
