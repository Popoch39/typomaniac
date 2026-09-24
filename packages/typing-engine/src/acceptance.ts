import { applyKeystroke, createRun, type Keystroke, type RunConfig, type RunState } from "./run";

// A Run as the server judges it in a Duel: its state and the Keystrokes it accepted (ADR 0003).
export type AcceptedRun = { run: RunState; keystrokes: readonly Keystroke[] };

// When the server judges a Keystroke, in ms since the start of the Run like its `at`: when it
// arrived, when the Run ends, and how late past the end a Keystroke may still arrive.
export type ArrivalWindow = { arrivedAt: number; endsAt: number; tolerance: number };

export type RejectReason = "before-start" | "after-arrival" | "out-of-order" | "after-end";

export type Acceptance =
  | { accepted: true; acceptedRun: AcceptedRun }
  | { accepted: false; reason: RejectReason };

export const startAcceptedRun = (config: RunConfig): AcceptedRun => ({
  run: createRun(config),
  keystrokes: [],
});

// Why the client's clock cannot be trusted for this Keystroke, or null when it can.
const rejectReason = (
  acceptedRun: AcceptedRun,
  { at }: Keystroke,
  { arrivedAt, endsAt, tolerance }: ArrivalWindow,
): RejectReason | null => {
  const previous = acceptedRun.keystrokes.at(-1);

  if (at < 0) {
    return "before-start";
  }

  if (at > arrivedAt) {
    return "after-arrival";
  }

  if (typeof previous !== "undefined" && at < previous.at) {
    return "out-of-order";
  }

  if (at >= endsAt || arrivedAt > endsAt + tolerance) {
    return "after-end";
  }

  return null;
};

// Accepts a Keystroke dated by the client when its date is plausible, and applies it. The engine
// still never reads the time: the arrival is stamped by the caller (ADR 0002).
export const acceptKeystroke = (
  acceptedRun: AcceptedRun,
  keystroke: Keystroke,
  window: ArrivalWindow,
): Acceptance => {
  const reason = rejectReason(acceptedRun, keystroke, window);

  if (reason !== null) {
    return { accepted: false, reason };
  }

  return {
    accepted: true,
    acceptedRun: {
      run: applyKeystroke(acceptedRun.run, keystroke),
      keystrokes: [...acceptedRun.keystrokes, keystroke],
    },
  };
};
