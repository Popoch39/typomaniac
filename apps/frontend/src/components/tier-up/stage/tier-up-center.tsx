import type { ReactNode } from "react";

import { BLASON_CENTRE } from "@/components/tier-up/stage/blason-centre";

// A point on the stage at the Blason's centre, as in the canvas: what it holds is placed around it.
export const TierUpCenter = ({ children }: { children: ReactNode }) => (
  <div className="absolute size-0" style={{ left: BLASON_CENTRE.x, top: BLASON_CENTRE.y }}>
    {children}
  </div>
);
