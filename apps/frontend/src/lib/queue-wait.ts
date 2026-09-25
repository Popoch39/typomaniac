// A wait as a clock shows it: minutes and seconds, "0:07", never negative.
export const formatElapsed = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000));

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

// How many Users are in the Queue, the User included.
export const queueSizeLabel = (size: number) =>
  size <= 1 ? "1 joueur en file" : `${size} joueurs en file`;

// The Estimated wait, rounded to the second above; nothing without one.
export const estimatedWaitLabel = (estimatedWait: number | null) =>
  estimatedWait === null ? null : `≈ ${Math.max(1, Math.ceil(estimatedWait / 1000))} s d'attente`;
