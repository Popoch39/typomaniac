import type { Tier } from "ranked";
import { useId } from "react";

import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { SHEEN } from "@/components/tier-up/parts/tier-up-sheen";

// The band of light that sweeps over a new Emblem, on its 32 grid: turned by 20°, cut to the
// Emblem's shape `d`, out of sight on its left until the timeline moves its `x`. Placed inside the
// Emblem's svg, over its engraving.
export const TierUpSheenBand = ({ tier, d }: { tier: Tier; d: string }) => {
  const { light } = tierUpPaint(tier);
  const id = useId();
  const clip = `${id}-clip`;
  const band = `${id}-band`;

  return (
    <>
      <defs>
        <clipPath id={clip}>
          <path d={d} />
        </clipPath>
        <linearGradient id={band} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={light} stopOpacity={0} />
          <stop offset="0.5" stopColor={light} stopOpacity={0.85} />
          <stop offset="1" stopColor={light} stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <g transform="rotate(20 16 16)">
          <rect
            data-tier-up="sheen"
            x={SHEEN.x}
            y={-6}
            width={8}
            height={44}
            fill={`url(#${band})`}
          />
        </g>
      </g>
    </>
  );
};
