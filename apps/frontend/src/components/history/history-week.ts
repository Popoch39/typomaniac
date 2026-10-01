// The weeks of the History, in the browser's time zone: a week runs from Monday's midnight to the
// next one's and is named by its Monday, `YYYY-MM-DD` (its key, in the URL too).
export type WeekKey = string;

// A day, `YYYY-MM-DD`, as the API counts the Activity in the same time zone.
export type DayKey = string;

// How many weeks the frieze of Activity shows.
export const FRIEZE_WEEKS = 16;

const DAYS_IN_A_WEEK = 7;

const WEEK_MS = DAYS_IN_A_WEEK * 24 * 60 * 60 * 1000;

const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

const twoDigits = (value: number) => String(value).padStart(2, "0");

export const dayKeyOf = (date: Date): DayKey =>
  `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;

// The local midnight of a day key, null for one that is not a real day.
const dateOf = (key: string): Date | null => {
  const match = DAY_KEY.exec(key);

  if (match === null) {
    return null;
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  return dayKeyOf(date) === key ? date : null;
};

// The local midnight of a key known to be a day: one this module wrote.
const midnightOf = (key: DayKey) => dateOf(key) ?? new Date(Number.NaN);

// The local noon of a key known to be a day: far enough from midnight for any change of time, to
// write it.
export const noonOf = (key: DayKey) => {
  const midnight = midnightOf(key);

  return new Date(midnight.getFullYear(), midnight.getMonth(), midnight.getDate(), 12);
};

// `days` after the day, at its midnight: a change of time never moves it off midnight.
const daysAfter = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

// The Monday on or before the day: getDay() counts from Sunday.
const mondayOf = (date: Date) => daysAfter(date, -((date.getDay() + 6) % DAYS_IN_A_WEEK));

export const weekKeyOf = (at: number): WeekKey => dayKeyOf(mondayOf(new Date(at)));

export const addWeeks = (week: WeekKey, weeks: number): WeekKey =>
  dayKeyOf(daysAfter(midnightOf(week), weeks * DAYS_IN_A_WEEK));

// The instants `[from, to)` of the week, in ms since the epoch, as the API reads its Duels.
export const weekRange = (week: WeekKey) => {
  const monday = midnightOf(week);

  return { from: monday.getTime(), to: daysAfter(monday, DAYS_IN_A_WEEK).getTime() };
};

// Whole weeks from `from` to `to`: an hour gained or lost on the way rounds off.
const weeksBetween = (from: WeekKey, to: WeekKey) =>
  Math.round((midnightOf(to).getTime() - midnightOf(from).getTime()) / WEEK_MS);

// The week the page shows for the `week` of its URL: any day of it names it; without one, a week
// to come or anything else, the current one.
export const shownWeekOf = (asked: string | undefined, now: number): WeekKey => {
  const current = weekKeyOf(now);
  const date = asked === undefined ? null : dateOf(asked);

  if (date === null) {
    return current;
  }

  const week = weekKeyOf(date.getTime());

  return weeksBetween(week, current) < 0 ? current : week;
};

// The last week of the frieze: the current one, unless the week shown is older than the frieze
// reaches, where the frieze follows it.
export const friezeEndOf = (shown: WeekKey, current: WeekKey): WeekKey =>
  weeksBetween(shown, current) >= FRIEZE_WEEKS ? shown : current;

// The instants of the frieze's 16 weeks, ending with `end`.
export const friezeRange = (end: WeekKey) => ({
  from: weekRange(addWeeks(end, 1 - FRIEZE_WEEKS)).from,
  to: weekRange(end).to,
});

// The URL's search for a week: none for the current one, which the page shows without it.
export const weekSearch = (week: WeekKey, current: WeekKey) => (week === current ? {} : { week });

// The week before the one shown, null when the User finished no Duel before it (`first`, their
// first Duel's end; null without one).
export const previousWeekOf = (shown: WeekKey, first: number | null) =>
  first === null || weekKeyOf(first) >= shown ? null : addWeeks(shown, -1);

// The week after the one shown, null for the current one.
export const nextWeekOf = (shown: WeekKey, current: WeekKey) =>
  shown >= current ? null : addWeeks(shown, 1);

// What the History shows at `now` for the `week` of its URL: that week, the current one, the last
// week of the frieze and today.
export const historyViewOf = (asked: string | undefined, now: number) => {
  const current = weekKeyOf(now);
  const shown = shownWeekOf(asked, now);

  return { shown, current, friezeEnd: friezeEndOf(shown, current), today: dayKeyOf(new Date(now)) };
};

export type HistoryView = ReturnType<typeof historyViewOf>;

export type FriezeDay = { day: DayKey; duels: number; future: boolean };

export type FriezeColumn = { week: WeekKey; days: FriezeDay[] };

// The frieze's columns, the oldest week first, each its seven days from Monday: how many Duels
// the User finished on it, and whether it is still to come after `today`.
export const friezeColumns = (
  end: WeekKey,
  today: DayKey,
  counts: ReadonlyMap<DayKey, number>,
): FriezeColumn[] =>
  Array.from({ length: FRIEZE_WEEKS }, (_, index) => {
    const week = addWeeks(end, index + 1 - FRIEZE_WEEKS);
    const monday = midnightOf(week);

    return {
      week,
      days: Array.from({ length: DAYS_IN_A_WEEK }, (_unused, offset) => {
        const day = dayKeyOf(daysAfter(monday, offset));

        return { day, duels: counts.get(day) ?? 0, future: day > today };
      }),
    };
  });

// The heat of a day on the frieze, from 0 (no Duel) to 4 (four Duels or more).
export const heatLevel = (duels: number) => Math.min(4, duels);

type Dated = { endedAt: number };

// The Duels by the day they ended, in the order given: the most recent first.
export const byDay = <T extends Dated>(duels: readonly T[]) => {
  const days = new Map<DayKey, T[]>();

  for (const duel of duels) {
    const day = dayKeyOf(new Date(duel.endedAt));

    days.set(day, [...(days.get(day) ?? []), duel]);
  }

  return [...days].map(([day, ofDay]) => ({ day, duels: ofDay }));
};

type Tallied = { outcome: "win" | "loss" | "draw"; tp: number | null };

export type Tally = { duels: number; wins: number; losses: number; draws: number; tp: number };

// How Duels went, together: how many, won, lost and drawn, and the TP they moved.
export const tallyOf = (duels: readonly Tallied[]): Tally => {
  const tally = { duels: duels.length, wins: 0, losses: 0, draws: 0, tp: 0 };

  for (const { outcome, tp } of duels) {
    tally.wins += outcome === "win" ? 1 : 0;
    tally.losses += outcome === "loss" ? 1 : 0;
    tally.draws += outcome === "draw" ? 1 : 0;
    tally.tp += tp ?? 0;
  }

  return tally;
};

// The wpm line's box, as the card draws it, and the room kept above and below the line.
const SPARK_WIDTH = 300;

const SPARK_HEIGHT = 56;

const SPARK_MARGIN = 4;

const tenths = (value: number) => Math.round(value * 10) / 10;

// The points of a side's wpm line across the box, by second: `max` (the higher of the two sides)
// at the top, 0 at the bottom. A single second spans the whole box.
export const sparkPoints = (wpmBySecond: readonly number[], max: number) => {
  const span = SPARK_HEIGHT - 2 * SPARK_MARGIN;
  const floor = SPARK_HEIGHT - SPARK_MARGIN;
  const ys = wpmBySecond.map((wpm) => tenths(floor - (max > 0 ? (wpm / max) * span : 0)));
  const points = ys.length === 1 ? [...ys, ...ys] : ys;
  const step = points.length > 1 ? SPARK_WIDTH / (points.length - 1) : 0;

  return points.map((y, index) => `${tenths(index * step)},${y}`).join(" ");
};
