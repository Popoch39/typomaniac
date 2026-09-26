const SECOND_MS = 1000;

// The frames, by the time each was drawn, still inside the second before `now`: as many as the
// frames per second.
export const framesInLastSecond = (frames: readonly number[], now: number) =>
  frames.filter((at) => now - at < SECOND_MS);
