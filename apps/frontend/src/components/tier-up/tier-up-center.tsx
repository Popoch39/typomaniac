import type { ReactNode } from "react";

// A point on the stage at the Blason's centre, as in the canvas: what it holds is placed around it.
export const TierUpCenter = ({ children }: { children: ReactNode }) => (
  <div className="absolute top-[350px] left-[720px] size-0">{children}</div>
);
