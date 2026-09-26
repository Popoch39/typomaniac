import { TIERS } from "ranked";

import {
  DEEPS,
  deepId,
  FEATHER_ID,
  FLAME_ID,
  GLOWS,
  glowId,
  HOT,
  HOT_ID,
  LEAF_ID,
  METALS,
  metalId,
  OUTLINES,
  SPARK_ID,
  STAR_ID,
} from "@/components/tier/tier-sprite-paint";

// The gradients and the shapes the Emblems and Ornaments share, on the mock-up's grid.
export const TierSpriteDefs = () => (
  <defs>
    {TIERS.map((tier) => {
      const metal = METALS[tier];

      return (
        <linearGradient key={tier} id={metalId(tier)} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={metal.light} />
          <stop offset="0.44" stopColor={metal.mid} />
          <stop offset="0.5" stopColor={metal.crease} />
          <stop offset="0.72" stopColor={metal.sheen} />
          <stop offset="1" stopColor={metal.crease} />
        </linearGradient>
      );
    })}
    <linearGradient id={HOT_ID} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={HOT.light} />
      <stop offset="0.5" stopColor={HOT.mid} />
      <stop offset="1" stopColor={HOT.deep} />
    </linearGradient>
    {DEEPS.map(({ tier, top }) => (
      <linearGradient key={tier} id={deepId(tier)} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={top} />
        <stop offset="1" stopColor={OUTLINES[tier]} />
      </linearGradient>
    ))}
    {GLOWS.map(({ tier, color, stops }) => (
      <radialGradient key={tier} id={glowId(tier)} cx="0.5" cy="0.5" r="0.5">
        {stops.map(([offset, opacity]) => (
          <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
        ))}
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    ))}
    <path id={LEAF_ID} d="M0 -10 C4.6 -5 4.6 5 0 10 C-4.6 5 -4.6 -5 0 -10 Z" />
    <path id={FEATHER_ID} d="M0 0 C-6 -9 -26 -12 -42 -5 C-37 -2 -38 1 -33 2 C-22 5 -8 5 0 0 Z" />
    <path
      id={FLAME_ID}
      d="M0 0 C-5 -4 -5.5 -10 0 -18 C1 -12 5.5 -10.5 4.5 -5.5 C4 -2.5 2 -0.8 0 0 Z"
    />
    <path
      id={STAR_ID}
      d="M16 8 L18.2 13.4 L24 13.6 L19.5 17.2 L21 22.8 L16 19.6 L11 22.8 L12.5 17.2 L8 13.6 L13.8 13.4 Z"
    />
    <path id={SPARK_ID} d="M0 -6 L1.3 -1.3 L6 0 L1.3 1.3 L0 6 L-1.3 1.3 L-6 0 L-1.3 -1.3 Z" />
  </defs>
);
