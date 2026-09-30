import type { CharCounts } from "typing-engine";

import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";
import type { DuelEnding } from "@/stores/duel-store";

// A side of the tale of the tape: this User's, at the left, or the opponent's.
export type TapeSide = "mine" | "theirs";

// Who has the best value of a line: level when both show the same figure.
export type TapeBest = TapeSide | "level";

export type TapeLine = {
  id: string;
  label: string;
  mine: string;
  theirs: string;
  best: TapeBest;
};

// One player's figures at the end of the Duel.
type PlayerFigures = Pick<DuelEnding, "result" | "score">;

type Figure = {
  id: string;
  label: (locale: Locale) => string;
  value: (player: PlayerFigures) => number;
  percent: boolean;
};

// The lines of the tale of the tape, in the board's order.
const FIGURES: Figure[] = [
  {
    id: "wpm",
    label: (locale) => m.run_stat_wpm({}, { locale }),
    value: (side) => side.result.wpm,
    percent: false,
  },
  {
    id: "accuracy",
    label: (locale) => m.run_stat_accuracy({}, { locale }),
    value: (side) => side.result.accuracy,
    percent: true,
  },
  {
    id: "best-combo",
    label: (locale) => m.run_stat_best_combo({}, { locale }),
    value: (side) => side.score.bestCombo,
    percent: false,
  },
  {
    id: "bursts",
    label: (locale) => m.run_stat_bursts({}, { locale }),
    value: (side) => side.score.bursts,
    percent: false,
  },
  {
    id: "raw",
    label: (locale) => m.run_stat_raw({}, { locale }),
    value: (side) => side.result.raw,
    percent: false,
  },
  {
    id: "consistency",
    label: (locale) => m.run_stat_consistency({}, { locale }),
    value: (side) => side.result.consistency,
    percent: true,
  },
];

const written = (value: number, percent: boolean, locale: Locale) => {
  const figure = numberFormat(locale).format(value);

  return percent ? m.format_percent({ value: figure }, { locale }) : figure;
};

// Compared as shown, rounded: 68.2 against 67.9 is a level line, never a win by a hair unseen.
const bestOf = (mine: number, theirs: number): TapeBest => {
  if (mine === theirs) {
    return "level";
  }

  return mine > theirs ? "mine" : "theirs";
};

// Each figure of the Duel for both players, rounded and written in the Locale, with who did best.
export const tapeLines = (me: PlayerFigures, opponent: PlayerFigures, locale: Locale): TapeLine[] =>
  FIGURES.map((figure) => {
    const mine = Math.round(figure.value(me));
    const theirs = Math.round(figure.value(opponent));

    return {
      id: figure.id,
      label: figure.label(locale),
      mine: written(mine, figure.percent, locale),
      theirs: written(theirs, figure.percent, locale),
      best: bestOf(mine, theirs),
    };
  });

// e.g. `142/3/0/1`: correct, incorrect, extra, missed.
export const tapeChars = (chars: CharCounts, locale: Locale) =>
  [chars.correct, chars.incorrect, chars.extra, chars.missed]
    .map((count) => numberFormat(locale).format(count))
    .join("/");
