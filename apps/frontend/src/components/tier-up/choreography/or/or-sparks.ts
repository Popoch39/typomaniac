import { glitterRain } from "@/components/tier-up/parts/glitter-rain";
import { sparkBurst } from "@/components/tier-up/parts/spark-burst";

// The sparks of the Argent → Or artboard: thirty-two, flying furthest, 180 to 420 px out.
export const OR_SPARKS = sparkBurst({
  count: 32,
  seed: 3,
  distance: [180, 420],
  size: [3, 8],
  delay: [0, 0.15],
  duration: [0.9, 1.5],
});

// Its rain of glitter: thirty pieces falling across the stage from just after the impact.
export const OR_GLITTER = glitterRain({
  count: 30,
  seed: 4,
  left: [240, 1200],
  fall: [860, 980],
  turn: [180, 720],
  delay: [2.15, 3.75],
  duration: [2, 3.4],
  size: [5, 11],
});
