import { describe, expect, test } from "vitest";

import type { Activity } from "@/api/activity";
import {
  ACTIVITY_FEED_SIZE,
  type Arrival,
  arrivalsAfter,
  feedItems,
  withActivity,
} from "@/lib/activity-feed";

const ada = { id: "ada-id", handle: "ada", image: null, ornament: null };

const friendship = (id: string, at: number): Activity => ({
  type: "friendship",
  id,
  at,
  friend: ada,
  other: { id: `${id}-id`, handle: id, image: null, ornament: null },
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

const arrival = (id: string, at: number): Arrival => ({ id, at, friend: ada });

describe("arrivalsAfter", () => {
  test("puts a new arrival first, once", () => {
    const older = arrival("a", 1_000);
    const newer = arrival("b", 2_000);

    expect(arrivalsAfter([older], { type: "friend-arrived", arrival: newer })).toEqual([
      newer,
      older,
    ]);
    expect(arrivalsAfter([newer], { type: "friend-arrived", arrival: newer })).toEqual([newer]);
  });

  test("forgets an ex-Friend's arrivals", () => {
    const alans = {
      id: "x",
      at: 1_000,
      friend: { id: "alan-id", handle: "alan", image: null, ornament: null },
    };

    expect(
      arrivalsAfter([arrival("a", 2_000), alans], { type: "friend-removed", userId: "alan-id" }),
    ).toEqual([arrival("a", 2_000)]);
  });

  test("keeps the arrivals on any other message", () => {
    const arrivals = [arrival("a", 1_000)];

    expect(arrivalsAfter(arrivals, { type: "idle" })).toBe(arrivals);
  });
});

describe("feedItems", () => {
  test("merges the arrivals with the Activities, the newest first", () => {
    const older = friendship("alan", 1_000);
    const newer = friendship("grace", 3_000);
    const arrived = arrival("a", 2_000);

    expect(feedItems([newer, older], [arrived])).toEqual([
      { kind: "activity", activity: newer },
      { kind: "arrival", arrival: arrived },
      { kind: "activity", activity: older },
    ]);
  });
});
