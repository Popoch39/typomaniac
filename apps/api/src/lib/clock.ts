// The server's time, injected through AppConfig so tests control it. In ms since the epoch.
export type Clock = {
  now: () => number;
  // Runs `callback` once the time reaches `at`.
  at: (at: number, callback: () => void) => void;
};

export const systemClock: Clock = {
  now: () => Date.now(),
  at: (at, callback) => {
    setTimeout(callback, Math.max(0, at - Date.now()));
  },
};
