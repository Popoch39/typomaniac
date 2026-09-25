type DuelClockProps = { elapsed: number; seconds: number };

// The seconds left, e.g. `29`, all of them during the Countdown: the Face-off shows the 3-2-1.
export const DuelClock = ({ elapsed, seconds }: DuelClockProps) => (
  <p role="timer" aria-label="temps restant" className="text-xl text-caret font-mono tabular-nums">
    {Math.max(0, Math.ceil(seconds - Math.max(0, elapsed) / 1000))}
  </p>
);
