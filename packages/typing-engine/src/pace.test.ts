import { describe, expect, test } from "bun:test";

import { defaultPace, paceDuels, paceOf } from "./index";

describe("paceOf", () => {
  test("a User without any Duel goes at the default Pace", () => {
    expect(paceOf([])).toBe(defaultPace);
  });

  test("the median of an odd number of Duels is the middle wpm", () => {
    expect(paceOf([72])).toBe(72);
    expect(paceOf([90, 60, 75])).toBe(75);
  });

  test("the median of an even number of Duels is the mean of the two middle wpm", () => {
    expect(paceOf([80, 60])).toBe(70);
    expect(paceOf([40, 100, 70, 50])).toBe(60);
  });

  test("with fewer than 10 Duels, all of them count", () => {
    expect(paceOf([10, 20, 30, 40, 50, 60, 70, 80, 90])).toBe(50);
  });

  test("only the 10 most recent Duels count, the first of the list", () => {
    const recent = [61, 62, 63, 64, 65, 66, 67, 68, 69, 70];

    expect(paceDuels).toBe(10);
    expect(paceOf([...recent, 200, 200, 200, 200, 200])).toBe(65.5);
  });
});
