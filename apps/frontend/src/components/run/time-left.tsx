import { useTimeLeft } from "@/components/run/use-time-left";

// Seconds left in a `time` Run, e.g. `29`.
export const TimeLeft = ({ seconds }: { seconds: number }) => {
  const left = useTimeLeft(seconds);

  return (
    <p role="timer" aria-label="temps restant" className="text-xl text-caret tabular-nums">
      {left}
    </p>
  );
};
