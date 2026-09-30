import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";

// A figure of the Stats, rounded and grouped by thousands in the Locale (« 1 612 », "1,612"); a dash
// without one (no Duel since the Score).
export const profileFigure = (value: number | null, locale: Locale) =>
  value === null ? "–" : numberFormat(locale).format(Math.round(value));
