import type { Division } from "ranked";

// The Division as bars under the emblem: one for IV, the lowest, up to four for I.
export const TierDivisionBars = ({ division }: { division: Division }) => (
  <span className="flex gap-0.5" aria-hidden>
    {Array.from({ length: 5 - division }, (_, index) => (
      <span key={index} className="h-1 w-2 rounded-full bg-current" data-division-bar />
    ))}
  </span>
);
