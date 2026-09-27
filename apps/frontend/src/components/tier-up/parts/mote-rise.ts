import { type Range, within } from "@/components/tier-up/parts/spark-burst";

// A mote of light rising from under the Blason, again and again: where it starts (px on the
// stage), how far it drifts and rises (px), when it first leaves and how long each rise lasts (s),
// its size (px).
export type TierUpMote = {
  left: number;
  top: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
};

type Rise = {
  count: number;
  seed: number;
  left: Range;
  top: Range;
  x: Range;
  y: Range;
  delay: Range;
  duration: Range;
  size: Range;
};

// `count` motes, each drawn from `seed` within its ranges, as the canvas raises them.
export const moteRise = ({ count, seed, left, top, x, y, delay, duration, size }: Rise) =>
  Array.from({ length: count }, (_, i): TierUpMote => ({
    left: within(left, seed + i * 2.3),
    top: within(top, seed + i * 4.1),
    x: within(x, seed + i * 6.7),
    y: within(y, seed + i * 8.9),
    delay: within(delay, seed + i * 1.7),
    duration: within(duration, seed + i * 3.3),
    size: within(size, seed + i * 5.9),
  }));

// The same motes, every other one sent to the left of the Blason's centre (from the first): where
// it starts and where it drifts, both mirrored. For motes placed from the centre, as two wings
// shed them.
export const onBothSides = (motes: readonly TierUpMote[]) =>
  motes.map((mote, i): TierUpMote => {
    const side = i % 2 === 0 ? -1 : 1;

    return { ...mote, left: side * mote.left, x: side * mote.x };
  });
