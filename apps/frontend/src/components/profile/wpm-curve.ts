import type { ProgressionPoint } from "@/api/profile";

// How many Duels each end of the trend reads: enough to see it through a bad Duel.
export const TREND_DUELS = 10;

export type WpmCurveRow = { duel: number; endedAt: number; wpm: number };

// The wpm curve of the Profile over a window: a row per Duel, oldest first; their average, lowest
// and highest; the best of them (the User's record when none is higher); the last.
export type WpmCurve = {
  rows: WpmCurveRow[];
  average: number;
  low: number;
  high: number;
  best: { duel: number; wpm: number; record: boolean };
  last: { duel: number; wpm: number };
};

const averageOf = (points: readonly ProgressionPoint[]) => {
  let sum = 0;

  for (const point of points) {
    sum += point.wpm;
  }

  return sum / points.length;
};

// The curve of `points`, the window's Duels; null without any. `record` is the User's best wpm.
export const wpmCurve = (
  points: readonly ProgressionPoint[],
  record: number | null,
): WpmCurve | null => {
  const [first] = points;

  if (first === undefined) {
    return null;
  }

  const rows: WpmCurveRow[] = [];
  let best = { duel: 0, wpm: first.wpm };
  let low = first.wpm;

  for (const [duel, point] of points.entries()) {
    rows.push({ duel, endedAt: point.endedAt, wpm: point.wpm });
    low = Math.min(low, point.wpm);

    if (point.wpm > best.wpm) {
      best = { duel, wpm: point.wpm };
    }
  }

  const lastDuel = points.length - 1;

  return {
    rows,
    average: averageOf(points),
    low,
    high: best.wpm,
    best: { ...best, record: record !== null && best.wpm >= record },
    last: { duel: lastDuel, wpm: points[lastDuel]?.wpm ?? first.wpm },
  };
};

// How far the wpm went over a window: the last 10 Duels' average less the first 10's; null under 20
// Duels, whose two ends would overlap.
export const wpmTrend = (points: readonly ProgressionPoint[]) =>
  points.length < 2 * TREND_DUELS
    ? null
    : averageOf(points.slice(-TREND_DUELS)) - averageOf(points.slice(0, TREND_DUELS));

// The spacing of the wpm axis's lines: wider as the curve spans more.
const tickStep = (range: number) => {
  if (range > 40) {
    return 20;
  }

  return range > 10 ? 10 : 5;
};

// The wpm axis of a curve from `low` to `high`: half a line's spacing of margin around it (4 wpm at
// least, never under 0), and a line at each multiple of the spacing within it.
export const wpmAxis = (low: number, high: number) => {
  const step = tickStep(high - low);
  const margin = Math.max(4, step / 2);
  const domain: [number, number] = [Math.max(0, low - margin), high + margin];
  const ticks: number[] = [];

  for (let tick = Math.ceil(domain[0] / step) * step; tick <= domain[1]; tick += step) {
    ticks.push(tick);
  }

  return { domain, ticks };
};
