import type { ReactNode } from "react";

// A piece of an Ornament on its 120 grid, drawn on the left, then mirrored on the right.
export const TierUpMirrored = ({ children }: { children: ReactNode }) => (
  <>
    {children}
    <g transform="translate(120 0) scale(-1 1)">{children}</g>
  </>
);
