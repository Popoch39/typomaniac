import { describe, expect, test } from "vitest";

import {
  pauseReplay,
  replayTime,
  resumeReplay,
  seekReplay,
  setReplaySpeed,
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

  test("a seek while paused goes to the instant and stays there", () => {
    const sought = seekReplay(pauseReplay(startReplay(0), 4_000, duration), 6_000, 12_000);

    expect(replayTime(sought, 6_000, duration)).toBe(12_000);
    expect(replayTime(sought, 20_000, duration)).toBe(12_000);
  });

  test("a seek while playing goes on from the instant", () => {
    const sought = seekReplay(startReplay(0), 6_000, 1_000);

    expect(replayTime(sought, 6_000, duration)).toBe(1_000);
    expect(replayTime(sought, 7_500, duration)).toBe(2_500);
  });

  test("a seek stays within the Duel", () => {
    expect(replayTime(seekReplay(startReplay(0), 0, -500), 0, duration)).toBe(0);
    expect(replayTime(seekReplay(startReplay(0), 0, 99_000), 0, duration)).toBe(duration);
  });

  test("at 2×, the time goes twice as fast as the clock", () => {
    const fast = setReplaySpeed(startReplay(0), 0, duration, 2);

    expect(replayTime(fast, 1_000, duration)).toBe(2_000);
  });

  test("changing the speed keeps the time, then goes on at the new pace", () => {
    const slow = setReplaySpeed(startReplay(0), 4_000, duration, 0.5);

    expect(replayTime(slow, 4_000, duration)).toBe(4_000);
    expect(replayTime(slow, 6_000, duration)).toBe(5_000);
  });

  test("the speed holds through a pause and a seek", () => {
    const fast = setReplaySpeed(startReplay(0), 0, duration, 2);
    const resumed = resumeReplay(seekReplay(pauseReplay(fast, 1_000, duration), 3_000, 0), 5_000);

    expect(replayTime(resumed, 6_000, duration)).toBe(2_000);
  });

  test("changing the speed while paused keeps the pause", () => {
    const paused = setReplaySpeed(pauseReplay(startReplay(0), 4_000, duration), 9_000, duration, 2);

    expect(replayTime(paused, 20_000, duration)).toBe(4_000);
  });
});
