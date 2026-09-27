import { describe, expect, test } from "vitest";

import { sparkBurst } from "@/components/tier-up/spark-burst";

const burst = {
  count: 16,
  seed: 1,
  distance: [150, 280],
  size: [3, 6],
  delay: [0, 0.12],
  duration: [0.8, 1.2],
} as const;

describe("sparkBurst", () => {
  test("draws the same sparks from the same seed, and others from another", () => {
    expect(sparkBurst(burst)).toEqual(sparkBurst(burst));
    expect(sparkBurst({ ...burst, seed: 2 })).not.toEqual(sparkBurst(burst));
  });

  test("keeps every spark within its ranges", () => {
    const sparks = sparkBurst(burst);

    expect(sparks).toHaveLength(16);

    for (const { x, y, size, delay, duration } of sparks) {
      expect(Math.hypot(x, y)).toBeGreaterThanOrEqual(150);
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(280);
      expect(size).toBeGreaterThanOrEqual(3);
      expect(size).toBeLessThanOrEqual(6);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(0.12);
      expect(duration).toBeGreaterThanOrEqual(0.8);
      expect(duration).toBeLessThanOrEqual(1.2);
    }
  });

  test("spreads the sparks all around the Blason", () => {
    const sparks = sparkBurst(burst);

    expect(sparks.some(({ x }) => x > 0)).toBe(true);
    expect(sparks.some(({ x }) => x < 0)).toBe(true);
    expect(sparks.some(({ y }) => y > 0)).toBe(true);
    expect(sparks.some(({ y }) => y < 0)).toBe(true);
  });
});
