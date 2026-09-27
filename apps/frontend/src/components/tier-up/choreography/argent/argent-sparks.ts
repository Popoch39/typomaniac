import { sparkBurst } from "@/components/tier-up/parts/spark-burst";

// The sparks of the Bronze → Argent artboard: twenty-six, flying further, 170 to 360 px out.
export const ARGENT_SPARKS = sparkBurst({
  count: 26,
  seed: 2,
  distance: [170, 360],
  size: [3, 7],
  delay: [0, 0.15],
  duration: [0.8, 1.4],
});
