import { describe, expect, test } from "bun:test";

import {
  acceptKeystroke,
  type AcceptedRun,
  type Keystroke,
  type RunConfig,
  startAcceptedRun,
} from "./index";

// A Duel's format on Seed 42, which starts with "small help while" (pinned in text.test.ts).
const config: RunConfig = {
  mode: "time",
  seconds: 30,
  language: "en",
  wordListVersion: 1,
  seed: 42,
};

const window = { endsAt: 30_000, tolerance: 1_000 };

const char = (value: string, at: number): Keystroke => ({ kind: "char", char: value, at });

// Accepts each Keystroke on arrival, and fails the test on a rejection.
const accepted = (keystrokes: readonly Keystroke[]) =>
  keystrokes.reduce((acceptedRun: AcceptedRun, keystroke) => {
    const acceptance = acceptKeystroke(acceptedRun, keystroke, {
      ...window,
      arrivedAt: keystroke.at,
    });

    if (!acceptance.accepted) {
      throw new Error(`Rejected: ${acceptance.reason}`);
    }

    return acceptance.acceptedRun;
  }, startAcceptedRun(config));

describe("acceptKeystroke", () => {
  test("an accepted Keystroke is applied to the Run and logged", () => {
    const acceptedRun = accepted([char("s", 100), char("m", 250)]);

    expect(acceptedRun.keystrokes).toEqual([char("s", 100), char("m", 250)]);
    expect(acceptedRun.run.words[0]?.typed).toBe("sm");
    expect(acceptedRun.run.letterIndex).toBe(2);
  });

  test("a Keystroke dated before the start is rejected", () => {
    const acceptance = acceptKeystroke(startAcceptedRun(config), char("s", -1), {
      ...window,
      arrivedAt: 50,
    });

    expect(acceptance).toEqual({ accepted: false, reason: "before-start" });
  });

  test("a Keystroke dated after its arrival is rejected", () => {
    const acceptance = acceptKeystroke(startAcceptedRun(config), char("s", 501), {
      ...window,
      arrivedAt: 500,
    });

    expect(acceptance).toEqual({ accepted: false, reason: "after-arrival" });
  });

  test("a Keystroke dated before the previous one is rejected", () => {
    const acceptance = acceptKeystroke(accepted([char("s", 300)]), char("m", 299), {
      ...window,
      arrivedAt: 400,
    });

    expect(acceptance).toEqual({ accepted: false, reason: "out-of-order" });
  });

  test("two Keystrokes dated at the same time are both accepted", () => {
    expect(accepted([char("s", 300), char("m", 300)]).keystrokes).toHaveLength(2);
  });

  test("a Keystroke typed before the end is accepted up to the end plus the tolerance", () => {
    const acceptance = acceptKeystroke(startAcceptedRun(config), char("s", 29_999), {
      ...window,
      arrivedAt: 31_000,
    });

    expect(acceptance.accepted).toBe(true);
  });

  test("a Keystroke arriving after the end plus the tolerance is rejected", () => {
    const acceptance = acceptKeystroke(startAcceptedRun(config), char("s", 29_999), {
      ...window,
      arrivedAt: 31_001,
    });

    expect(acceptance).toEqual({ accepted: false, reason: "after-end" });
  });

  test("a Keystroke dated at the end or later is rejected", () => {
    const acceptance = acceptKeystroke(startAcceptedRun(config), char("s", 30_000), {
      ...window,
      arrivedAt: 30_100,
    });

    expect(acceptance).toEqual({ accepted: false, reason: "after-end" });
  });
});
