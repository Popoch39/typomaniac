const RADIUS = 26;

const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Beside the average accuracy: a ring filled to it, from the top, clockwise, as large as its tile
// allows. Only seen, the figure says it.
export const AccuracyRing = ({ accuracy }: { accuracy: number }) => (
  <svg viewBox="0 0 64 64" className="size-[clamp(3.5rem,34cqmin,6rem)] shrink-0" aria-hidden>
    <circle cx="32" cy="32" r={RADIUS} fill="none" strokeWidth="8" className="stroke-surface-2" />
    <circle
      cx="32"
      cy="32"
      r={RADIUS}
      fill="none"
      strokeWidth="8"
      strokeLinecap="round"
      strokeDasharray={`${((Math.min(accuracy, 100) / 100) * CIRCUMFERENCE).toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`}
      transform="rotate(-90 32 32)"
      className="stroke-foreground"
    />
  </svg>
);
