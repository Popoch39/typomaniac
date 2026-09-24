import { computeTimeline, type TimelineEntry } from "typing-engine";

import type { ReplayedDuel } from "@/api/duel-history";
import { replayConfig, replayDuration } from "@/components/replay/replay-sides";

// A second of the Duel chart: the wpm, raw and Misses of both sides, rounded. No Misses is no
// point; a deleted opponent has no values at all.
export type DuelChartRow = {
  second: number;
  ownWpm: number;
  ownRaw: number;
  ownMisses: number | null;
  opponentWpm: number | null;
  opponentRaw: number | null;
  opponentMisses: number | null;
};

const missesOf = (entry: TimelineEntry | undefined) =>
  entry === undefined || entry.misses === 0 ? null : entry.misses;

const roundedOf = (value: number | undefined) => (value === undefined ? null : Math.round(value));

// Both timelines of the Duel, second by second, up to its end: a Forfeit stops them there.
export const duelChartRows = (duel: ReplayedDuel): DuelChartRow[] => {
  const config = replayConfig(duel);
  const duration = replayDuration(duel);

  const opponent =
    duel.opponent === null ? [] : computeTimeline(config, duel.opponent.keystrokes, duration);

  return computeTimeline(config, duel.me.keystrokes, duration).map((own, i) => ({
    second: own.second,
    ownWpm: Math.round(own.wpm),
    ownRaw: Math.round(own.raw),
    ownMisses: missesOf(own),
    opponentWpm: roundedOf(opponent[i]?.wpm),
    opponentRaw: roundedOf(opponent[i]?.raw),
    opponentMisses: missesOf(opponent[i]),
  }));
};
