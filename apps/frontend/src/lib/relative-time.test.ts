import { describe, expect, test } from "vitest";

import { relativeTime } from "@/lib/relative-time";

const NOW = 1_000_000_000;

describe("relativeTime", () => {
  test("says the largest unit reached", () => {
    expect(relativeTime(NOW - 30_000, NOW)).toBe("à l'instant");
    expect(relativeTime(NOW - 5 * 60_000, NOW)).toBe("il y a 5 minutes");
    expect(relativeTime(NOW - 3 * 3_600_000, NOW)).toBe("il y a 3 heures");
    expect(relativeTime(NOW - 86_400_000, NOW)).toBe("hier");
  });

  test("takes a date past now for now", () => {
    expect(relativeTime(NOW + 60_000, NOW)).toBe("à l'instant");
  });
});
