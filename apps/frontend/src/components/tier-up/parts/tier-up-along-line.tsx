import type { ReactNode } from "react";

// A line through the Blason's centre, turned by `angle` (deg): what it holds moves along it in
// its own `x`. Placed in a `TierUpCenter`.
export const TierUpAlongLine = ({ angle, children }: { angle: number; children: ReactNode }) => (
  <div className="absolute top-0 left-0" style={{ transform: `rotate(${angle}deg)` }}>
    {children}
  </div>
);
