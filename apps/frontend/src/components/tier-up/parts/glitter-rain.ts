import { type Range, within } from "@/components/tier-up/parts/spark-burst";

// A piece of glitter raining over the stage: where it falls from (px from the stage's left, just
// above its top), how far it falls and turns (px, deg), when it starts and how long it falls (s),
// its size (px).
export type TierUpGlitterPiece = {
  left: number;
  fall: number;
  turn: number;
  delay: number;
  duration: number;
  size: number;
};

type Rain = {
  count: number;
  seed: number;
  left: Range;
  fall: Range;
  turn: Range;
  delay: Range;
  duration: Range;
  size: Range;
};

// `count` pieces of glitter, each drawn from `seed` within its ranges, as the canvas rains them.
export const glitterRain = ({ count, seed, left, fall, turn, delay, duration, size }: Rain) =>
  Array.from({ length: count }, (_, i): TierUpGlitterPiece => ({
    left: within(left, seed + i * 2.3),
    fall: within(fall, seed + i * 4.1),
    turn: within(turn, seed + i * 6.7),
    delay: within(delay, seed + i * 8.9),
    duration: within(duration, seed + i * 1.7),
    size: within(size, seed + i * 3.3),
  }));
