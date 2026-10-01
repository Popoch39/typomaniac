import type { ReplayedDuel, ReplayedPlayer } from "@/api/duel-history";
import { duelNumber } from "@/components/duel-history/duel-number";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// A line of the Results table: what it measures (`id`, and `name` in the Locale), the User's value,
// then the opponent's (null once their User is deleted), as they read.
export type DuelResultLine = {
  id: DuelResultId;
  name: string;
  own: string;
  opponent: string | null;
};

// What a line of the Results table measures.
type DuelResultId =
  | "score"
  | "wpm"
  | "raw"
  | "accuracy"
  | "consistency"
  | "best-combo"
  | "bursts"
  | "average-wpm";

const percent = (value: number, locale: Locale) =>
  m.format_percent({ value: duelNumber(value, locale) }, { locale });

type Measure = {
  id: DuelResultId;
  name: (locale: Locale) => string;
  of: (player: ReplayedPlayer, locale: Locale) => string;
};

// What a line reads of a player, in the table's order.
const MEASURES: Measure[] = [
  {
    id: "score",
    name: (locale) => m.duel_results_score({}, { locale }),
    of: ({ score }, locale) => duelNumber(score?.score ?? null, locale),
  },
  {
    id: "wpm",
    name: (locale) => m.duel_results_wpm({}, { locale }),
    of: ({ result }, locale) => duelNumber(result.wpm, locale),
  },
  {
    id: "raw",
    name: (locale) => m.duel_results_raw({}, { locale }),
    of: ({ result }, locale) => duelNumber(result.raw, locale),
  },
  {
    id: "accuracy",
    name: (locale) => m.duel_results_accuracy({}, { locale }),
    of: ({ result }, locale) => percent(result.accuracy, locale),
  },
  {
    id: "consistency",
    name: (locale) => m.duel_results_consistency({}, { locale }),
    of: ({ result }, locale) => percent(result.consistency, locale),
  },
  // Null for a Duel played before the Score, like the Score itself.
  {
    id: "best-combo",
    name: (locale) => m.duel_results_best_combo({}, { locale }),
    of: ({ score }, locale) => duelNumber(score?.bestCombo ?? null, locale),
  },
  {
    id: "bursts",
    name: (locale) => m.duel_results_bursts({}, { locale }),
    of: ({ score }, locale) => duelNumber(score?.bursts ?? null, locale),
  },
];

// Over a Bo3's Rounds, each side's wpm averaged by the server; the opponent's null once their User
// is deleted.
export type DuelAverage = { own: number; opponent: number | null };

// The seven lines comparing both sides of a finished Duel (or of one Round of a Bo3), in the
// Locale; then, for a Bo3, the line of the Duel's average.
export const duelResultLines = (
  { me, opponent }: ReplayedDuel,
  locale: Locale,
  average: DuelAverage | null = null,
): DuelResultLine[] => {
  const lines: DuelResultLine[] = MEASURES.map(({ id, name, of }) => ({
    id,
    name: name(locale),
    own: of(me, locale),
    opponent: opponent === null ? null : of(opponent, locale),
  }));

  if (average === null) {
    return lines;
  }

  return [
    ...lines,
    {
      id: "average-wpm",
      name: m.duel_results_average_wpm({}, { locale }),
      own: duelNumber(average.own, locale),
      opponent: opponent === null ? null : duelNumber(average.opponent, locale),
    },
  ];
};
