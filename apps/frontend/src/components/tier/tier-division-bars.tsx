import type { Division } from "@/components/tier/tier";

// The division (1 to 3) as that many bars under the emblem.
export const TierDivisionBars = ({ division }: { division: Division }) => (
  <span className="flex gap-0.5" aria-hidden>
    {Array.from({ length: division }, (_, index) => (
      <span key={index} className="h-1 w-2 rounded-full bg-current" data-division-bar />
    ))}
  </span>
);
