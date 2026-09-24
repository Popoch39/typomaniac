// How fast a Replay plays against the clock.
export const replaySpeeds = [0.5, 1, 2] as const;

export type ReplaySpeed = (typeof replaySpeeds)[number];

// Where a Replay stands: `at` ms into the Duel, running since the clock read `since` at `speed`, or
// paused (`since` null). Pure: the caller reads the clock, so the tests drive the time by hand.
export type ReplayClock = { at: number; since: number | null; speed: ReplaySpeed };

export const startReplay = (now: number, speed: ReplaySpeed = 1): ReplayClock => ({
  at: 0,
  since: now,
  speed,
});

// The Replay's time `t` at clock time `now`, from 0 to the Duel's `duration`, in ms.
export const replayTime = ({ at, since, speed }: ReplayClock, now: number, duration: number) =>
  Math.min(duration, since === null ? at : at + (now - since) * speed);

export const pauseReplay = (replay: ReplayClock, now: number, duration: number): ReplayClock => ({
  at: replayTime(replay, now, duration),
  since: null,
  speed: replay.speed,
});

export const resumeReplay = (replay: ReplayClock, now: number): ReplayClock =>
  replay.since === null ? { ...replay, since: now } : replay;

// Straight to the instant `target`: a paused Replay stays paused there, a running one goes on from
// it.
export const seekReplay = (replay: ReplayClock, now: number, target: number): ReplayClock => ({
  at: Math.max(0, target),
  since: replay.since === null ? null : now,
  speed: replay.speed,
});

// The same instant, from which the Replay goes on at `speed`.
export const setReplaySpeed = (
  replay: ReplayClock,
  now: number,
  duration: number,
  speed: ReplaySpeed,
): ReplayClock => ({
  at: replayTime(replay, now, duration),
  since: replay.since === null ? null : now,
  speed,
});
