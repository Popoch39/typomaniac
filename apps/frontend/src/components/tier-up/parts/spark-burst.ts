// A spark of the Tier-up's impact: where it flies to from the centre of the Blason (px), its size
// (px), how long after the impact it leaves and how long it flies (s).
export type TierUpSpark = { x: number; y: number; size: number; delay: number; duration: number };

type Range = readonly [min: number, max: number];

type Burst = {
  count: number;
  seed: number;
  distance: Range;
  size: Range;
  delay: Range;
  duration: Range;
};

// A number in [0, 1) that only depends on `n`: the sparks fly the same way on every Tier-up.
const random = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;

  return x - Math.floor(x);
};

const within = ([min, max]: Range, n: number) => min + random(n) * (max - min);

// `count` sparks around the circle, each turned a little off its place, flying out as far as
// `distance`, all drawn from `seed`.
export const sparkBurst = ({ count, seed, distance, size, delay, duration }: Burst) =>
  Array.from({ length: count }, (_, i): TierUpSpark => {
    const angle = (i / count) * Math.PI * 2 + random(seed + i) * 0.7;
    const reach = within(distance, seed + i * 3.1);

    return {
      x: Math.cos(angle) * reach,
      y: Math.sin(angle) * reach,
      size: within(size, seed + i * 5.7),
      delay: within(delay, seed + i * 7.3),
      duration: within(duration, seed + i * 9.1),
    };
  });
