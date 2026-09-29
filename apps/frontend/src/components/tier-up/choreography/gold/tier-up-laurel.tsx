import type { Tier } from "ranked";

import { LEAVES, STEMS } from "@/components/tier-up/choreography/gold/laurel-leaves";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

// Each leaf scaled about its own centre by `--pop`, as the artboard's `transform-box: fill-box`
// does: GSAP moves the variable, never an SVG transform.
const POPPED = "origin-center [transform-box:fill-box] [transform:scale(var(--pop,1))]";

// The laurels the Silver → Gold artboard draws around the Gold Emblem: their stems trace themselves,
// then their leaves pop in, pair by pair, up to the shoulders. On the Emblem's 32 grid, under its
// metal.
export const TierUpLaurel = ({ tier }: { tier: Tier }) => {
  const { crease, outline, leaf } = tierUpPaint(tier);

  return (
    <svg viewBox="0 0 32 32" className="absolute inset-0 size-full overflow-visible">
      <g data-tier-up="laurel">
        {STEMS.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={crease}
            strokeWidth={0.5}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
          />
        ))}
      </g>
      {LEAVES.map(({ x, y, turn, pair }) => (
        <g key={`${x} ${y}`} data-tier-up={`leaf-${pair}`} className={POPPED} opacity={0}>
          <ellipse
            cx={x}
            cy={y}
            rx={2.2}
            ry={0.85}
            transform={`rotate(${turn} ${x} ${y})`}
            fill={leaf}
            stroke={outline}
            strokeWidth={0.3}
          />
        </g>
      ))}
    </svg>
  );
};
