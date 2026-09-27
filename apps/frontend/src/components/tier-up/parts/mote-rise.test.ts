import { describe, expect, test } from "vitest";

import { moteRise } from "@/components/tier-up/parts/mote-rise";

// The motes of the Or → Platine artboard: rising, so drawn from -280 up to -480.
const rise = {
  count: 28,
  seed: 6,
  left: [540, 900],
  top: [440, 550],
  x: [-50, 50],
  y: [-280, -480],
  delay: [2.5, 5.1],
  duration: [2.4, 4],
  size: [3, 6.5],
} as const;

// The canvas's own random numbers, to check the motes against its script.
const canvasRandom = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;

  return x - Math.floor(x);
};

describe("moteRise", () => {
  test("draws the same motes from the same seed, and other motes from another", () => {
    expect(moteRise(rise)).toEqual(moteRise(rise));
    expect(moteRise({ ...rise, seed: 7 })).not.toEqual(moteRise(rise));
  });

  test("draws them as the canvas does", () => {
    const [first, second] = moteRise(rise);

    expect(first?.left).toBeCloseTo(540 + canvasRandom(6) * 360);
    expect(second?.y).toBeCloseTo(-280 - canvasRandom(6 + 8.9) * 200);
    expect(second?.delay).toBeCloseTo(2.5 + canvasRandom(6 + 1.7) * 2.6);
  });

  test("keeps every mote within its ranges, each rising", () => {
    const motes = moteRise(rise);

    expect(motes).toHaveLength(28);

    for (const { left, top, x, y, delay, duration, size } of motes) {
      expect(left).toBeGreaterThanOrEqual(540);
      expect(left).toBeLessThanOrEqual(900);
      expect(top).toBeGreaterThanOrEqual(440);
      expect(top).toBeLessThanOrEqual(550);
      expect(Math.abs(x)).toBeLessThanOrEqual(50);
      expect(y).toBeLessThanOrEqual(-280);
      expect(y).toBeGreaterThanOrEqual(-480);
      expect(delay).toBeGreaterThanOrEqual(2.5);
      expect(delay).toBeLessThanOrEqual(5.1);
      expect(duration).toBeGreaterThanOrEqual(2.4);
      expect(duration).toBeLessThanOrEqual(4);
      expect(size).toBeGreaterThanOrEqual(3);
      expect(size).toBeLessThanOrEqual(6.5);
    }
  });
});
