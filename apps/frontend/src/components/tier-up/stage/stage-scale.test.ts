import { describe, expect, test } from "vitest";

import { stageScale } from "@/components/tier-up/stage/stage-scale";

describe("stageScale", () => {
  test("is 1 in a window of the stage's size", () => {
    expect(stageScale(1440, 900)).toBe(1);
  });

  test("shrinks the stage to the narrower side of a smaller window", () => {
    expect(stageScale(1280, 900)).toBeCloseTo(1280 / 1440);
    expect(stageScale(1440, 720)).toBeCloseTo(0.8);
  });

  test("grows the stage in a larger window, whole", () => {
    expect(stageScale(2880, 2000)).toBe(2);
    expect(stageScale(3000, 1350)).toBe(1.5);
  });
});
