import { type Range, within } from "@/components/tier-up/parts/spark-burst";

// A star twinkling around the Blason, again and again: where it sits from its centre (px), and
// when it first twinkles (s).
export type TierUpTwinkle = { x: number; y: number; delay: number };

type Ring = {
  count: number;
  seed: number;
  // How far from the centre each star sits, and how much flatter the ring is than tall.
  reach: Range;
  squash: number;
  delay: Range;
};

// `count` stars scattered on a ring around the Blason, squashed a little, all drawn from `seed`,
// as the canvas scatters them.
export const twinkleRing = ({ count, seed, reach, squash, delay }: Ring) =>
  Array.from({ length: count }, (_, i): TierUpTwinkle => {
    const angle = within([0, Math.PI * 2], seed + i);
    const distance = within(reach, seed + i * 2.2);

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance * squash,
      delay: within(delay, seed + i * 3.3),
    };
  });
