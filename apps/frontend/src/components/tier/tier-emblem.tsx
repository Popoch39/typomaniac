import type { ReactNode } from "react";

import type { Tier } from "ranked";

const SHIELD = "M16 2 L28 6 V15 C28 23 22 28 16 30 C10 28 4 23 4 15 V6 Z";

const STAR = "M16 9 L18 14 L23 14 L19 17 L20.5 22 L16 19 L11.5 22 L13 17 L9 14 L14 14 Z";

const EMBLEM_INSET_FILL = "fill-background/35";

const CHEVRON = "fill-none stroke-background/60";

// One drawing per Tier, on a 32×32 grid, filled with the current colour.
const EMBLEMS: Record<Tier, ReactNode> = {
  fer: <path d={SHIELD} />,
  bronze: (
    <>
      <path d={SHIELD} />
      <path d="M10 14 L16 19 L22 14" className={CHEVRON} strokeWidth={3} />
    </>
  ),
  argent: (
    <>
      <path d={SHIELD} />
      <path d="M10 11 L16 16 L22 11" className={CHEVRON} strokeWidth={3} />
      <path d="M10 17 L16 22 L22 17" className={CHEVRON} strokeWidth={3} />
    </>
  ),
  or: (
    <>
      <path d={SHIELD} />
      <path d={STAR} className={EMBLEM_INSET_FILL} />
    </>
  ),
  platine: (
    <>
      <path d="M16 2 L28 9 V23 L16 30 L4 23 V9 Z" />
      <path d={STAR} className={EMBLEM_INSET_FILL} />
    </>
  ),
  diamant: (
    <>
      <path d="M9 4 H23 L30 12 L16 30 L2 12 Z" />
      <path
        d="M2 12 H30 M9 4 L12 12 L16 30 L20 12 L23 4"
        className="fill-none stroke-background/40"
        strokeWidth={1.5}
      />
    </>
  ),
  maniac: (
    <>
      <path d="M3 10 L10 16 L16 6 L22 16 L29 10 L26 25 H6 Z" />
      <path d="M6 27 H26 V29 H6 Z" />
    </>
  ),
};

export const TierEmblem = ({ tier }: { tier: Tier }) => (
  <svg viewBox="0 0 32 32" className="size-full fill-current" aria-hidden data-tier-emblem>
    {EMBLEMS[tier]}
  </svg>
);
