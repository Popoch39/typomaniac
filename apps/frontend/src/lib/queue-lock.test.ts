import { describe, expect, test } from "vitest";

import { lockSecondsLeft, lockTimeLeftLabel, queueLockLabel } from "@/lib/queue-lock";

describe("lockSecondsLeft", () => {
  test("counts the whole seconds left, the last one until it is over", () => {
    expect([0, 59_001, 59_999, 60_000, 61_000].map((now) => lockSecondsLeft(60_000, now))).toEqual([
      60, 1, 1, 0, 0,
    ]);
  });
});

describe("lockTimeLeftLabel", () => {
  test("shows minutes and seconds", () => {
    expect([900, 60, 1].map(lockTimeLeftLabel)).toEqual(["15:00", "1:00", "0:01"]);
  });
});

describe("queueLockLabel", () => {
  test("says how long the Queue is locked, in minutes", () => {
    expect([60_000, 300_000, 900_000].map(queueLockLabel)).toEqual([
      "Queue bloquée 1 min",
      "Queue bloquée 5 min",
      "Queue bloquée 15 min",
    ]);
  });

  test("rounds a lock told a little late up to its minute", () => {
    expect(queueLockLabel(59_950)).toBe("Queue bloquée 1 min");
    expect(queueLockLabel(12_000)).toBe("Queue bloquée 1 min");
  });
});
