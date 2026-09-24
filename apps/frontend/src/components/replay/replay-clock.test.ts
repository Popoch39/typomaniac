import { describe, expect, test } from "vitest";

import {
  pauseReplay,
  replayTime,
  resumeReplay,
  startReplay,
} from "@/components/replay/replay-clock";

const duration = 30_000;

describe("replay clock", () => {
  test("starts at 0 and follows the clock", () => {
    const replay = startReplay(1_000);

    expect(replayTime(replay, 1_000, duration)).toBe(0);
    expect(replayTime(replay, 3_500, duration)).toBe(2_500);
  });

  test("stops at the duration", () => {
    expect(replayTime(startReplay(0), 45_000, duration)).toBe(duration);
  });

  test("a pause holds the time, whatever the clock does", () => {
    const paused = pauseReplay(startReplay(0), 4_000, duration);

    expect(replayTime(paused, 4_000, duration)).toBe(4_000);
    expect(replayTime(paused, 60_000, duration)).toBe(4_000);
  });

  test("resuming goes on from where it paused", () => {
    const resumed = resumeReplay(pauseReplay(startReplay(0), 4_000, duration), 10_000);

    expect(replayTime(resumed, 10_000, duration)).toBe(4_000);
    expect(replayTime(resumed, 11_000, duration)).toBe(5_000);
  });

  test("resuming a running Replay changes nothing", () => {
    const running = startReplay(0);

    expect(resumeReplay(running, 5_000)).toBe(running);
  });

  test("a pause past the end holds the end", () => {
    expect(replayTime(pauseReplay(startReplay(0), 99_000, duration), 99_000, duration)).toBe(
      duration,
    );
  });
});
