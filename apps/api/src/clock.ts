// The server's time, injected through AppConfig so tests control it. In ms since the epoch.
export type Clock = { now: () => number };

export const systemClock: Clock = { now: () => Date.now() };
