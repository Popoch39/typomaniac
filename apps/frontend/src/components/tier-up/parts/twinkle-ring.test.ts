import { describe, expect, test } from "vitest";

import { twinkleRing } from "@/components/tier-up/parts/twinkle-ring";

// The stars of the Platinum → Diamond artboard.
const ring = { count: 12, seed: 10, reach: [190, 340], squash: 0.85, delay: [4.3, 6.5] } as const;

// The canvas's own random numbers, to check the stars against its script.
const canvasRandom = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;

  return x - Math.floor(x);
};

describe("twinkleRing", () => {
  test("draws the same stars from the same seed, and other stars from another", () => {
    expect(twinkleRing(ring)).toEqual(twinkleRing(ring));
    expect(twinkleRing({ ...ring, seed: 11 })).not.toEqual(twinkleRing(ring));
  });

  test("draws them as the canvas does", () => {
    const [, second] = twinkleRing(ring);
    const angle = canvasRandom(11) * Math.PI * 2;
    const reach = 190 + canvasRandom(10 + 2.2) * 150;

    expect(second?.x).toBeCloseTo(Math.cos(angle) * reach);
    expect(second?.y).toBeCloseTo(Math.sin(angle) * reach * 0.85);
    expect(second?.delay).toBeCloseTo(4.3 + canvasRandom(10 + 3.3) * 2.2);
  });

  test("keeps every star on the squashed ring, twinkling first within its range", () => {
    const stars = twinkleRing(ring);

    expect(stars).toHaveLength(12);

    for (const { x, y, delay } of stars) {
      const reach = Math.hypot(x, y / 0.85);

      expect(reach).toBeGreaterThanOrEqual(190 - 1e-9);
      expect(reach).toBeLessThanOrEqual(340 + 1e-9);
      expect(delay).toBeGreaterThanOrEqual(4.3);
      expect(delay).toBeLessThanOrEqual(6.5);
    }
  });
});
