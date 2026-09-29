import { RunCounter } from "@/components/run/run-counter";
import { useTimeLeft } from "@/components/run/use-time-left";

// Seconds left in a `time` Run, e.g. `29`.
export const TimeLeft = ({ seconds }: { seconds: number }) => {
  const left = useTimeLeft(seconds);

  return (
    <RunCounter role="timer" aria-label="temps restant">
      {left}
    </RunCounter>
  );
};
