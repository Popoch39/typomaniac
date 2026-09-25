import { describe, expect, test } from "vitest";

import type { Activity } from "@/api/activity";
import { ACTIVITY_FEED_SIZE, withActivity } from "@/lib/activity-feed";

const ada = { id: "ada-id", handle: "ada", image: null };

const friendship = (id: string, at: number): Activity => ({
  type: "friendship",
  id,
  at,
  friend: ada,
  other: { id: `${id}-id`, handle: id, image: null },
});

describe("withActivity", () => {
  test("puts the new Activity first", () => {
    const older = friendship("alan", 1_000);
    const newer = friendship("grace", 2_000);

    expect(withActivity([older], newer)).toEqual([newer, older]);
  });

  test("keeps an Activity once, the one just told", () => {
    const told = friendship("alan", 2_000);

    expect(withActivity([friendship("alan", 1_000)], told)).toEqual([told]);
  });

  test(`keeps the newest ${ACTIVITY_FEED_SIZE}`, () => {
    const feed = Array.from({ length: ACTIVITY_FEED_SIZE }, (_, index) =>
      friendship(`user${index}`, ACTIVITY_FEED_SIZE - index),
    );

    const newest = friendship("newest", 1_000);
    const after = withActivity(feed, newest);

    expect(after).toHaveLength(ACTIVITY_FEED_SIZE);
    expect(after[0]).toBe(newest);
    expect(after.at(-1)).toBe(feed.at(-2));
  });
});
