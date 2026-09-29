import { DUEL_CHART_COLORS } from "@/components/duel-chart/duel-chart-colors";
import type { ChartConfig } from "@/components/ui/chart";
import { opponentName } from "@/lib/opponent-name";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// The User's series, named in the Locale: « Toi wpm », "Your wpm".
const ownConfig = (locale: Locale): ChartConfig => ({
  ownWpm: { label: m.duel_chart_own_wpm({}, { locale }), color: DUEL_CHART_COLORS.own },
  ownRaw: { label: m.duel_chart_own_raw({}, { locale }), color: DUEL_CHART_COLORS.own },
  ownMisses: { label: m.duel_chart_own_misses({}, { locale }), color: DUEL_CHART_COLORS.own },
});

// The opponent's series, named after them in the Locale: « @alan wpm », "@alan's wpm".
const opponentConfig = (opponent: string, locale: Locale): ChartConfig => ({
  opponentWpm: {
    label: m.duel_chart_opponent_wpm({ opponent }, { locale }),
    color: DUEL_CHART_COLORS.opponent,
  },
  opponentRaw: {
    label: m.duel_chart_opponent_raw({ opponent }, { locale }),
    color: DUEL_CHART_COLORS.opponent,
  },
  opponentMisses: {
    label: m.duel_chart_opponent_misses({ opponent }, { locale }),
    color: DUEL_CHART_COLORS.opponent,
  },
});

// Every series of the Duel chart, labelled with its player; the User's alone once the opponent is
// deleted.
export const duelChartConfig = (
  opponent: { handle: string } | null,
  locale: Locale,
): ChartConfig =>
  opponent === null
    ? ownConfig(locale)
    : { ...ownConfig(locale), ...opponentConfig(opponentName(opponent, locale), locale) };

// A value of an axis or of the tooltip, grouped in the Locale: « 1 284 », "1,284".
export const duelChartFigure = (value: number, locale: Locale) =>
  numberFormat(locale).format(value);
