import { moteRise } from "@/components/tier-up/parts/mote-rise";
import { sparkBurst } from "@/components/tier-up/parts/spark-burst";

// The sparks of the Or → Platine artboard: thirty-four, flying furthest yet, 190 to 440 px out.
export const PLATINE_SPARKS = sparkBurst({
  count: 34,
  seed: 5,
  distance: [190, 440],
  size: [3, 8],
  delay: [0, 0.15],
  duration: [0.9, 1.5],
});

// Its motes of light: twenty-eight, rising from under the Blason from just after the impact, each
// drifting a little as it goes up, 280 to 480 px.
export const PLATINE_MOTES = moteRise({
  count: 28,
  seed: 6,
  left: [540, 900],
  top: [440, 550],
  x: [-50, 50],
  y: [-280, -480],
  delay: [2.5, 5.1],
  duration: [2.4, 4],
  size: [3, 6.5],
});

// Where its three plumes of light rise from (px from the stage's left), and when each first rises
// (s): one after the other, left to right.
export const PLATINE_PLUMES = [
  { left: 510, at: 2.6 },
  { left: 630, at: 3.5 },
  { left: 750, at: 4.3 },
] as const;
