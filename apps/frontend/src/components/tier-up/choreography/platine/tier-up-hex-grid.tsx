import type { Tier } from "ranked";
import { useId } from "react";

import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

// One tile of the grid of hexagons, 48.5 × 84 px: a hexagon and the edges it shares with the next
// row.
const TILE =
  "M24.25 -14 L48.5 0 L48.5 28 L24.25 42 L0 28 L0 0 Z M0 28 L24.25 42 L24.25 70 L0 84 M48.5 28 L24.25 42 M24.25 70 L48.5 84";

// The grid fades out this far from the Blason.
const GRID_MASK = "radial-gradient(ellipse 48% 54% at 50% 39%, black 20%, transparent 78%)";

// The grid of light the Or → Platine artboard spreads behind the Blason as it lands: faint
// hexagons over the whole stage, fading away from it, unseen until then. It grows from the
// Blason's centre.
export const TierUpHexGrid = ({ tier }: { tier: Tier }) => {
  const grid = `${useId()}-grid`;

  return (
    <div className="absolute inset-0" style={{ maskImage: GRID_MASK }}>
      <div data-tier-up="grid" className="absolute inset-0 origin-[720px_350px] opacity-0">
        <svg width={1440} height={900} className="absolute inset-0">
          <defs>
            <pattern id={grid} patternUnits="userSpaceOnUse" width={48.5} height={84}>
              <path d={TILE} fill="none" stroke={tierUpPaint(tier).grid} strokeWidth={1.2} />
            </pattern>
          </defs>
          <rect width={1440} height={900} fill={`url(#${grid})`} />
        </svg>
      </div>
    </div>
  );
};
