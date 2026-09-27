import { describe, expect, test } from "vitest";

import { polarBurst } from "@/components/tier-up/parts/polar-burst";

// The shards of glass of the Platine → Diamant artboard.
const burst = {
  count: 34,
  seed: 8,
  reach: [380, 820],
  delay: [3.8, 3.92],
  duration: [1.1, 1.6],
} as const;

// The canvas's own random numbers, to check the pieces against its script.
const canvasRandom = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;

  return x - Math.floor(x);
};

describe("polarBurst", () => {
  test("draws the same pieces from the same seed, and other pieces from another", () => {
    expect(polarBurst(burst)).toEqual(polarBurst(burst));
    expect(polarBurst({ ...burst, seed: 9 })).not.toEqual(polarBurst(burst));
  });

  test("draws them as the canvas does", () => {
    const [first, second] = polarBurst(burst);

    expect(first?.angle).toBeCloseTo(canvasRandom(8) * 20);
    expect(second?.angle).toBeCloseTo(360 / 34 + canvasRandom(9) * 20);
    expect(second?.reach).toBeCloseTo(380 + canvasRandom(8 + 3.1) * 440);
    expect(second?.delay).toBeCloseTo(3.8 + canvasRandom(8 + 7.3) * 0.12);
    expect(second?.duration).toBeCloseTo(1.1 + canvasRandom(8 + 9.1) * 0.5);
    expect(second?.length).toBeCloseTo(30 + canvasRandom(8 + 4.4) * 60);
    expect(second?.width).toBeCloseTo(14 + canvasRandom(8 + 5.5) * 22);
    expect(second?.spin).toBeCloseTo(-540 + canvasRandom(8 + 6.6) * 1080);
  });

  test("spreads them all around the circle, each within its ranges", () => {
    const pieces = polarBurst(burst);

    expect(pieces).toHaveLength(34);

    for (const [
      index,
      { angle, reach, delay, duration, length, width, spin },
    ] of pieces.entries()) {
      expect(angle).toBeGreaterThanOrEqual((index / 34) * 360);
      expect(angle).toBeLessThanOrEqual((index / 34) * 360 + 20);
      expect(reach).toBeGreaterThanOrEqual(380);
      expect(reach).toBeLessThanOrEqual(820);
      expect(delay).toBeGreaterThanOrEqual(3.8);
      expect(delay).toBeLessThanOrEqual(3.92);
      expect(duration).toBeGreaterThanOrEqual(1.1);
      expect(duration).toBeLessThanOrEqual(1.6);
      expect(length).toBeGreaterThanOrEqual(30);
      expect(length).toBeLessThanOrEqual(90);
      expect(width).toBeGreaterThanOrEqual(14);
      expect(width).toBeLessThanOrEqual(36);
      expect(Math.abs(spin)).toBeLessThanOrEqual(540);
    }
  });
});
