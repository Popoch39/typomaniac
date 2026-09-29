import { sparkBurst } from "@/components/tier-up/parts/spark-burst";

// The sparks of the Iron → Bronze artboard: sixteen, flying 150 to 280 px out in about a second.
export const BRONZE_SPARKS = sparkBurst({
  count: 16,
  seed: 1,
  distance: [150, 280],
  size: [3, 6],
  delay: [0, 0.12],
  duration: [0.8, 1.2],
});
