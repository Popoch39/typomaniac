import { polarBurst } from "@/components/tier-up/parts/polar-burst";
import { sparkBurst } from "@/components/tier-up/parts/spark-burst";
import { twinkleRing } from "@/components/tier-up/parts/twinkle-ring";

// The lights of the Platine → Diamant artboard, drawn from its own seeds.

// Its streaks of light: forty-four, rushing from 480 to 900 px out into the heart of light, one
// after the other from 1.3 s.
export const DIAMANT_STREAKS = polarBurst({
  count: 44,
  seed: 7,
  reach: [480, 900],
  delay: [1.3, 2.6],
  duration: [0.6, 0.9],
});

// Its shards of glass: thirty-four, flung 380 to 820 px out by the impact, each spinning away.
export const DIAMANT_GLASS = polarBurst({
  count: 34,
  seed: 8,
  reach: [380, 820],
  delay: [3.8, 3.92],
  duration: [1.1, 1.6],
});

// Its sparks: thirty, flying 200 to 520 px out.
export const DIAMANT_SPARKS = sparkBurst({
  count: 30,
  seed: 9,
  distance: [200, 520],
  size: [3, 8],
  delay: [0, 0.2],
  duration: [1, 1.7],
});

// Its stars: twelve, twinkling around the Blason, each first from 4.3 s to 6.5 s.
export const DIAMANT_TWINKLES = twinkleRing({
  count: 12,
  seed: 10,
  reach: [190, 340],
  squash: 0.85,
  delay: [4.3, 6.5],
});
