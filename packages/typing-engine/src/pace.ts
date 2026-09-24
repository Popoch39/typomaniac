import { defaultPace } from "./score";

// How many of a User's last Duels make their Pace.
export const paceDuels = 10;

// A User's Pace, in wpm, from the wpm of their finished Duels, the most recent first: the median of
// the last 10 at most, or the default Pace without any Duel.
export const paceOf = (recentWpms: readonly number[]) => {
  const sorted = recentWpms.slice(0, paceDuels).toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle];

  if (typeof upper === "undefined") {
    return defaultPace;
  }

  return sorted.length % 2 === 1 ? upper : ((sorted[middle - 1] ?? upper) + upper) / 2;
};
