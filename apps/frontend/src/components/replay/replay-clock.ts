// Where a Replay stands: `at` ms into the Duel, running since the clock read `since`, or paused
// (`since` null). Pure: the caller reads the clock, so the tests drive the time by hand.
export type ReplayClock = { at: number; since: number | null };

export const startReplay = (now: number): ReplayClock => ({ at: 0, since: now });

// The Replay's time `t` at clock time `now`, from 0 to the Duel's `duration`, in ms.
export const replayTime = ({ at, since }: ReplayClock, now: number, duration: number) =>
  Math.min(duration, since === null ? at : at + now - since);

export const pauseReplay = (replay: ReplayClock, now: number, duration: number): ReplayClock => ({
  at: replayTime(replay, now, duration),
  since: null,
});

export const resumeReplay = (replay: ReplayClock, now: number): ReplayClock =>
  replay.since === null ? { at: replay.at, since: now } : replay;
