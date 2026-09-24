// An instant of the Replay in seconds, to the tenth: `3,1 s`.
export const replaySeconds = (ms: number) =>
  `${(ms / 1000).toLocaleString("fr", { maximumFractionDigits: 1 })} s`;
