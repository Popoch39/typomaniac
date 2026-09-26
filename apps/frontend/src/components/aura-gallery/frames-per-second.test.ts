import { describe, expect, test } from "vitest";

import { framesInLastSecond } from "@/components/aura-gallery/frames-per-second";

describe("framesInLastSecond", () => {
  test("keeps the frames drawn less than a second before now", () => {
    expect(framesInLastSecond([0, 400, 1000, 1500, 1990], 2000)).toEqual([1500, 1990]);
  });

  test("counts sixty frames at sixty frames per second", () => {
    // Two seconds of frames, the last one drawn now.
    const frames = Array.from({ length: 121 }, (_, frame) => (frame * 1000) / 60);

    expect(framesInLastSecond(frames, 2000)).toHaveLength(60);
  });
});
