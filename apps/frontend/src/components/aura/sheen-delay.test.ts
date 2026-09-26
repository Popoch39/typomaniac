import { describe, expect, test } from "vitest";

import { SHEEN_PERIOD, sheenDelay } from "@/components/aura/sheen-delay";

describe("sheenDelay", () => {
  test("is the same for the same instance, every time", () => {
    expect(sheenDelay("_r_4_")).toBe(sheenDelay("_r_4_"));
  });

  test("differs between neighbouring instances", () => {
    const delays = ["_r_1_", "_r_2_", "_r_3_", "_r_4_", "_r_5_"].map(sheenDelay);

    expect(new Set(delays).size).toBe(delays.length);
  });

  test("falls within one period of the sheen", () => {
    for (let index = 0; index < 200; index += 1) {
      const delay = sheenDelay(`_r_${index.toString(36)}_`);

      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThan(SHEEN_PERIOD);
    }
  });

  test("spreads a list over the whole period rather than bunching it", () => {
    const delays = Array.from({ length: 100 }, (_, index) => sheenDelay(`_r_${index}_`));
    const quarters = new Set(delays.map((delay) => Math.floor((delay / SHEEN_PERIOD) * 4)));

    expect(quarters.size).toBe(4);
  });
});
