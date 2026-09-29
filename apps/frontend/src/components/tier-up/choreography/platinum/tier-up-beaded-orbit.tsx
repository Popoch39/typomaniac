import type { Tier } from "ranked";

import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

// The ring's diameter (px).
const SIZE = 560;

// The beads of light set on the ring: where each sits on its box (px), its size (px), and how far
// it glows and spreads (px).
const BEADS = [
  { x: 280, y: 0, size: 12, blur: 14, spread: 3 },
  { x: 521, y: 419, size: 10, blur: 12, spread: 3 },
  { x: 37, y: 419, size: 8, blur: 10, spread: 2 },
] as const;

// A thin ring around the Blason with three beads of light on it, as the Gold → Platinum artboard
// draws it: unseen until it fades in, then turning while the Tier-up waits. Placed in a
// `TierUpCenter`.
export const TierUpBeadedOrbit = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <div
      data-tier-up="orbit"
      className="absolute opacity-0"
      style={{ left: -SIZE / 2, top: -SIZE / 2, width: SIZE, height: SIZE }}
    >
      <div
        className="relative size-full rounded-full"
        style={{ border: `1px solid ${paint.orbit(35)}` }}
      >
        {BEADS.map(({ x, y, size, blur, spread }) => (
          <i
            key={`${x} ${y}`}
            className="absolute rounded-full"
            style={{
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              background: paint.light,
              boxShadow: paint.glow(blur, spread),
            }}
          />
        ))}
      </div>
    </div>
  );
};
