import type { ProgressionPoint } from "@/api/profile";
import type { ProgressionMetric } from "@/components/profile/progression-rows";
import { dateFormat, numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

const TENTHS = { maximumFractionDigits: 1 } as const;

const POINT_DATE = { dateStyle: "short", timeStyle: "short" } as const;

// A value of the Progression rounded to a tenth, in the Locale: « 1 284,4 », "1,284.4".
export const progressionFigure = (value: number, locale: Locale) =>
  numberFormat(locale, TENTHS).format(value);

// When a Duel of the Progression ended, in the Locale: « 25/09/2026 09:05 », "9/25/26, 9:05 AM".
export const progressionPointDate = (point: ProgressionPoint, locale: Locale) =>
  dateFormat(locale, POINT_DATE).format(point.endedAt);

// The four exact values of a Duel of the Progression, in the Locale.
export const progressionPointFigures = (point: ProgressionPoint, locale: Locale) =>
  m.profile_progression_point(
    {
      wpm: progressionFigure(point.wpm, locale),
      raw: progressionFigure(point.raw, locale),
      accuracy: progressionFigure(point.accuracy, locale),
      consistency: progressionFigure(point.consistency, locale),
    },
    { locale },
  );

// A metric's name, in the Locale.
export const progressionMetricName = (metric: ProgressionMetric, locale: Locale) => {
  switch (metric) {
    case "wpm": {
      return m.profile_progression_metric_wpm({}, { locale });
    }

    case "raw": {
      return m.profile_progression_metric_raw({}, { locale });
    }

    case "accuracy": {
      return m.profile_progression_metric_accuracy({}, { locale });
    }

    case "consistency": {
      return m.profile_progression_metric_consistency({}, { locale });
    }
  }
};
