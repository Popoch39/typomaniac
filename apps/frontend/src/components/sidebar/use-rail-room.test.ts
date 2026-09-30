import { describe, expect, test } from "vitest";

import { railRowsShown } from "@/components/sidebar/use-rail-room";

describe("railRowsShown", () => {
  test("draws every row when they fit, with no « +N » when none is left out", () => {
    expect(railRowsShown(240, 5, 5)).toBe(5);
  });

  test("keeps room for « +N » under the rows when some are left out", () => {
    expect(railRowsShown(272, 5, 8)).toBe(5);
    expect(railRowsShown(271, 5, 8)).toBe(4);
  });

  test("draws only the rows that fit whole above « +N »", () => {
    expect(railRowsShown(239, 5, 5)).toBe(4);
    expect(railRowsShown(130, 5, 5)).toBe(2);
  });

  test("draws no row when not even « +N » and one row fit", () => {
    expect(railRowsShown(60, 5, 5)).toBe(0);
    expect(railRowsShown(0, 5, 5)).toBe(0);
  });
});
