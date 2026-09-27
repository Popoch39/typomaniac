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

// The sparks of the Bronze → Argent artboard: twenty-six, flying further, 170 to 360 px out.
export const ARGENT_SPARKS = sparkBurst({
  count: 26,
  seed: 2,
  distance: [170, 360],
  size: [3, 7],
  delay: [0, 0.15],
  duration: [0.8, 1.4],
});

// The sparks of the Fer → Bronze artboard: sixteen, flying 150 to 280 px out in about a second.
export const BRONZE_SPARKS = sparkBurst({
  count: 16,
  seed: 1,
  distance: [150, 280],
  size: [3, 6],
  delay: [0, 0.12],
  duration: [0.8, 1.2],
});
