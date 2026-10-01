import { type DayKey, noonOf, type Tally, type WeekKey } from "@/components/history/history-week";
import { dateFormat, numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

const SHORT_DAY = { month: "short", day: "numeric" } as const;

const LONG_DAY = { weekday: "long", month: "short", day: "numeric" } as const;

const TIME = { timeStyle: "short" } as const;

// « 28 sept. », "Sep 28".
export const shortDay = (day: DayKey, locale: Locale) =>
  dateFormat(locale, SHORT_DAY).format(noonOf(day));

// « jeudi 1 oct. », "Thursday, Oct 1".
export const longDay = (day: DayKey, locale: Locale) =>
  dateFormat(locale, LONG_DAY).format(noonOf(day));

// The week from its Monday to its Sunday: « 28 sept. – 4 oct. », "Sep 28 – Oct 4".
export const weekLabel = (week: WeekKey, locale: Locale) => {
  const sunday = noonOf(week);

  sunday.setDate(sunday.getDate() + 6);

  return m.history_week_range(
    { from: shortDay(week, locale), to: dateFormat(locale, SHORT_DAY).format(sunday) },
    { locale },
  );
};

// The title of a day of the week shown: Today, Yesterday, or « jeudi 1 oct. », "Thursday, Oct 1".
export const dayTitle = (day: DayKey, today: DayKey, locale: Locale) => {
  const date = noonOf(day);
  const yesterday = noonOf(today);

  yesterday.setDate(yesterday.getDate() - 1);

  if (day === today) {
    return m.history_day_today({}, { locale });
  }

  return date.getTime() === yesterday.getTime()
    ? m.history_day_yesterday({}, { locale })
    : longDay(day, locale);
};

// When a Duel ended, the time of day only: « 22:40 », "10:40 PM".
export const timeOfDay = (endedAt: number, locale: Locale) =>
  dateFormat(locale, TIME).format(endedAt);

// TP, signed with a true minus: « +12 », « −4 », « +0 ».
export const signedFigure = (tp: number, locale: Locale) =>
  `${tp >= 0 ? "+" : "−"}${numberFormat(locale).format(Math.abs(tp))}`;

// A day's Duels together: « 3 Duels · 2 V 1 D · +12 TP », the Draws only when there were some.
export const dayTallyLine = (tally: Tally, locale: Locale) => {
  const figure = (value: number) => numberFormat(locale).format(value);

  const parts = {
    duels: m.history_day_duels({ count: tally.duels, shown: figure(tally.duels) }, { locale }),
    wins: figure(tally.wins),
    losses: figure(tally.losses),
    tp: signedFigure(tally.tp, locale),
  };

  return tally.draws === 0
    ? m.history_day_tally(parts, { locale })
    : m.history_day_tally_draws({ ...parts, draws: figure(tally.draws) }, { locale });
};
