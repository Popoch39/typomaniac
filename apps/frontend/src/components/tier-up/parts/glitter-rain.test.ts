import { describe, expect, test } from "vitest";

import { glitterRain } from "@/components/tier-up/parts/glitter-rain";

const rain = {
  count: 30,
  seed: 4,
  left: [240, 1200],
  fall: [860, 980],
  turn: [180, 720],
  delay: [2.15, 3.75],
  duration: [2, 3.4],
  size: [5, 11],
} as const;

describe("glitterRain", () => {
  test("draws the same glitter from the same seed, and other glitter from another", () => {
    expect(glitterRain(rain)).toEqual(glitterRain(rain));
    expect(glitterRain({ ...rain, seed: 5 })).not.toEqual(glitterRain(rain));
  });

  test("keeps every piece within its ranges", () => {
    const pieces = glitterRain(rain);

    expect(pieces).toHaveLength(30);

    for (const { left, fall, turn, delay, duration, size } of pieces) {
      expect(left).toBeGreaterThanOrEqual(240);
      expect(left).toBeLessThanOrEqual(1200);
      expect(fall).toBeGreaterThanOrEqual(860);
      expect(fall).toBeLessThanOrEqual(980);
      expect(turn).toBeGreaterThanOrEqual(180);
      expect(turn).toBeLessThanOrEqual(720);
      expect(delay).toBeGreaterThanOrEqual(2.15);
      expect(delay).toBeLessThanOrEqual(3.75);
      expect(duration).toBeGreaterThanOrEqual(2);
      expect(duration).toBeLessThanOrEqual(3.4);
      expect(size).toBeGreaterThanOrEqual(5);
      expect(size).toBeLessThanOrEqual(11);
    }
  });

  test("scatters the glitter across the stage, not all at once", () => {
    const pieces = glitterRain(rain);

    expect(pieces.some(({ left }) => left < 720)).toBe(true);
    expect(pieces.some(({ left }) => left > 720)).toBe(true);
    expect(new Set(pieces.map(({ delay }) => delay)).size).toBe(30);
  });
});
