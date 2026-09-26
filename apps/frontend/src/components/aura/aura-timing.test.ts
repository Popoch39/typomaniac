import { describe, expect, test } from "vitest";

import { SHEEN_PERIOD, SPARK_PERIOD, sheenDelay, sparkDelay } from "@/components/aura/aura-timing";

const NEIGHBOURS = ["_r_1_", "_r_2_", "_r_3_", "_r_4_", "_r_5_"];

describe.each([
  ["sheenDelay", sheenDelay, SHEEN_PERIOD],
  ["sparkDelay", sparkDelay, SPARK_PERIOD],
] as const)("%s", (_name, delay, period) => {
  test("is the same for the same instance, every time", () => {
    expect(delay("_r_4_")).toBe(delay("_r_4_"));
  });

  test("differs between neighbouring instances", () => {
    const delays = NEIGHBOURS.map(delay);

    expect(new Set(delays).size).toBe(delays.length);
  });

  test("falls within one period", () => {
    for (let index = 0; index < 200; index += 1) {
      const each = delay(`_r_${index.toString(36)}_`);

      expect(each).toBeGreaterThanOrEqual(0);
      expect(each).toBeLessThan(period);
    }
  });

  test("spreads a list over the whole period rather than bunching it", () => {
    const delays = Array.from({ length: 100 }, (_, index) => delay(`_r_${index}_`));
    const quarters = new Set(delays.map((each) => Math.floor((each / period) * 4)));

    expect(quarters.size).toBe(4);
  });
});
