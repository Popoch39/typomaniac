import { type Range, within } from "@/components/tier-up/parts/spark-burst";

// A piece flying along a line through the Blason's centre (a streak of light, a shard of glass):
// the line's angle (deg), how far out along it the piece goes or comes from (px), when it leaves
// and how long it flies (s), its length and width (px), and how far it spins on its way (deg).
export type TierUpRay = {
  angle: number;
  reach: number;
  delay: number;
  duration: number;
  length: number;
  width: number;
  spin: number;
};

type Burst = { count: number; seed: number; reach: Range; delay: Range; duration: Range };

// How far a line is turned off its place around the circle, at most (deg).
const OFF_DEG = 20;

// Every piece's length and width (px), and its spin (deg), as the canvas draws them all.
const LENGTH: Range = [30, 90];

const WIDTH: Range = [14, 36];

const SPIN: Range = [-540, 540];

// `count` pieces around the circle, each on a line turned a little off its place, all drawn from
// `seed`, as the canvas draws them.
export const polarBurst = ({ count, seed, reach, delay, duration }: Burst) =>
  Array.from({ length: count }, (_, i): TierUpRay => ({
    angle: (i / count) * 360 + within([0, OFF_DEG], seed + i),
    reach: within(reach, seed + i * 3.1),
    delay: within(delay, seed + i * 7.3),
    duration: within(duration, seed + i * 9.1),
    length: within(LENGTH, seed + i * 4.4),
    width: within(WIDTH, seed + i * 5.5),
    spin: within(SPIN, seed + i * 6.6),
  }));
