import type { ReactNode } from "react";

// Where the 120 grid of an Ornament lies over the Emblem's 320 px box, from where the sprite
// places the Emblem on it (`EMBLEM_OUTLINES`): how far it reaches past the box's left and top, and
// how wide it is, in px.
export type OrnamentBox = { left: number; top: number; size: number };

type TierUpOrnamentLayerProps = { box: OrnamentBox; children: ReactNode };

// A layer on the 120 grid of the Ornament, laid over the Emblem's box as the sprite lays them:
// pieces of the Ornament (wings) drawn around the Emblem the Tier-up brings in.
export const TierUpOrnamentLayer = ({ box, children }: TierUpOrnamentLayerProps) => (
  <svg
    viewBox="0 0 120 120"
    className="absolute overflow-visible"
    style={{ left: -box.left, top: -box.top, width: box.size, height: box.size }}
  >
    {children}
  </svg>
);
