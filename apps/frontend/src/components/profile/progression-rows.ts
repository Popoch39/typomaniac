import type { ProgressionPoint } from "@/api/profile";

// How many Duels the rolling average reads: enough to see the trend through a bad Duel.
export const ROLLING_DUELS = 10;

export type ProgressionMetric = "wpm" | "raw" | "accuracy" | "consistency";

export type ProgressionRow = { duel: number; endedAt: number; value: number; average: number };

// One row per Duel, oldest first: its value of `metric` and the average of that value over the last
// 10 Duels up to it (over those so far before the 10th).
export const progressionRows = (
  points: readonly ProgressionPoint[],
  metric: ProgressionMetric,
): ProgressionRow[] => {
  const rows: ProgressionRow[] = [];
  let sum = 0;

  for (const [duel, point] of points.entries()) {
    sum += point[metric];

    const dropped = points[duel - ROLLING_DUELS];

    if (dropped !== undefined) {
      sum -= dropped[metric];
    }

    rows.push({
      duel,
      endedAt: point.endedAt,
      value: point[metric],
      average: sum / Math.min(duel + 1, ROLLING_DUELS),
    });
  }

  return rows;
};
