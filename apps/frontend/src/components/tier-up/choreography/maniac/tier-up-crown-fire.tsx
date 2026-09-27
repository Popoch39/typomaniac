import { CROWN_FIRE } from "@/components/tier-up/choreography/maniac/maniac-paint";

// The gradients the crown's fire is painted with in the Tier-up, each down its piece's height.
// Placed in the crown's svg.
export const TierUpCrownFire = () => (
  <defs>
    {Object.values(CROWN_FIRE).map(({ id, stops }) => (
      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
        {stops.map(([offset, color]) => (
          <stop key={offset} offset={offset} stopColor={color} />
        ))}
      </linearGradient>
    ))}
  </defs>
);
