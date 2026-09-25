type DuelClockProps = { elapsed: number; seconds: number };

// The Countdown 3-2-1 before the start, then the seconds left, e.g. `29`.
export const DuelClock = ({ elapsed, seconds }: DuelClockProps) => {
  const counting = elapsed < 0;

  return (
    <p
      role="timer"
      aria-label={counting ? "départ dans" : "temps restant"}
      className="text-xl text-caret font-mono tabular-nums"
    >
      {counting ? Math.ceil(-elapsed / 1000) : Math.max(0, Math.ceil(seconds - elapsed / 1000))}
    </p>
  );
};
