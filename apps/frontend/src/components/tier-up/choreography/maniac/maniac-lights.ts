import { moteRise, onBothSides } from "@/components/tier-up/parts/mote-rise";
import { polarBurst } from "@/components/tier-up/parts/polar-burst";
import { sparkBurst } from "@/components/tier-up/parts/spark-burst";

// The lights of the Diamond → Maniac artboard, drawn from its own seeds.

// Its embers rising from under the stage as the heat comes: fourteen, from 0.4 s, each rising
// 620 to 1040 px over 4 to 6 s, again and again.
export const MANIAC_EARLY_EMBERS = moteRise({
  count: 14,
  seed: 11,
  left: [0, 1440],
  top: [880, 940],
  x: [-90, 90],
  y: [-620, -1040],
  delay: [0.4, 2.4],
  duration: [4, 6],
  size: [3, 8],
});

// Its embers once the crown has caught fire: forty-six, from 6.9 s, faster, over everything.
export const MANIAC_LATE_EMBERS = moteRise({
  count: 46,
  seed: 12,
  left: [0, 1440],
  top: [880, 940],
  x: [-90, 90],
  y: [-620, -1040],
  delay: [6.9, 9.9],
  duration: [3, 5],
  size: [3, 8],
});

// The embers the vortex sucks in: forty-two, swirling in from 300 to 720 px out, from 2.2 s.
export const MANIAC_SWIRL = polarBurst({
  count: 42,
  seed: 13,
  reach: [300, 720],
  delay: [2.2, 3.1],
  duration: [0.9, 1.35],
  off: 30,
});

// The sparks of the crown's quake: thirty-eight, flung 220 to 620 px out, flattened over the
// floor.
export const MANIAC_SPARKS = sparkBurst({
  count: 38,
  seed: 14,
  distance: [220, 620],
  size: [3, 9],
  delay: [0, 0.1],
  duration: [1, 1.6],
  squash: 0.45,
});

// The gusts of embers as the crown catches fire: forty-eight, blown 360 to 820 px out.
export const MANIAC_GUST_SPARKS = sparkBurst({
  count: 48,
  seed: 15,
  distance: [360, 820],
  size: [4, 10],
  delay: [0, 0.15],
  duration: [1.4, 2.2],
});

// The sparks the wings shed as they spread: thirty, from 5.9 s, every other one from the left
// wing, each flying up and out, placed from the Blason's centre.
export const MANIAC_SHED = onBothSides(
  moteRise({
    count: 30,
    seed: 16,
    left: [170, 320],
    top: [-40, -190],
    x: [90, 350],
    y: [-60, -320],
    delay: [5.9, 7.3],
    duration: [1, 1.9],
    size: [3, 8],
  }),
);
