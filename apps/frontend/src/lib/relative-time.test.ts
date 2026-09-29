import { describe, expect, test } from "vitest";

import { relativeTime } from "@/lib/relative-time";

const NOW = 1_000_000_000;

describe("relativeTime", () => {
  test("says the largest unit reached", () => {
    expect(relativeTime(NOW - 30_000, NOW, "fr")).toBe("à l'instant");
    expect(relativeTime(NOW - 5 * 60_000, NOW, "fr")).toBe("il y a 5 minutes");
    expect(relativeTime(NOW - 3 * 3_600_000, NOW, "fr")).toBe("il y a 3 heures");
    expect(relativeTime(NOW - 86_400_000, NOW, "fr")).toBe("hier");
  });

  test("takes a date past now for now", () => {
    expect(relativeTime(NOW + 60_000, NOW, "fr")).toBe("à l'instant");
  });

  test("says it in English", () => {
    expect(
      [30_000, 60_000, 5 * 60_000, 3 * 3_600_000, 86_400_000, 2 * 86_400_000].map((ago) =>
        relativeTime(NOW - ago, NOW, "en"),
      ),
    ).toEqual([
      "just now",
      "1 minute ago",
      "5 minutes ago",
      "3 hours ago",
      "yesterday",
      "2 days ago",
    ]);
  });
});
