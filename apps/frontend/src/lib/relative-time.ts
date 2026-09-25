const format = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

// From the largest unit down: the first one the gap reaches is the one said.
const UNITS = [
  { unit: "day", ms: 86_400_000 },
  { unit: "hour", ms: 3_600_000 },
  { unit: "minute", ms: 60_000 },
] as const;

// How long ago `at` was, seen from `now` (ms since the epoch): « à l'instant » under a minute,
// « il y a 5 minutes », « hier »…
export const relativeTime = (at: number, now: number) => {
  const gap = Math.max(0, now - at);
  const match = UNITS.find(({ ms }) => gap >= ms);

  return match ? format.format(-Math.floor(gap / match.ms), match.unit) : "à l'instant";
};
