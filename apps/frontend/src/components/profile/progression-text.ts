import type { ProgressionPoint } from "@/api/profile";
import { dateFormat, numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";

const TENTHS = { maximumFractionDigits: 1 } as const;

const POINT_DATE = { dateStyle: "short", timeStyle: "short" } as const;

// A value of the Progression rounded to a tenth, in the Locale: « 1 284,4 », "1,284.4".
export const progressionFigure = (value: number, locale: Locale) =>
  numberFormat(locale, TENTHS).format(value);

// When a Duel of the Progression ended, in the Locale: « 25/09/2026 09:05 », "9/25/26, 9:05 AM".
export const progressionPointDate = (point: Pick<ProgressionPoint, "endedAt">, locale: Locale) =>
  dateFormat(locale, POINT_DATE).format(point.endedAt);
