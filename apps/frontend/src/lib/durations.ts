import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// A whole number of seconds with its unit, in the Locale: « 30 s ».
export const secondsLabel = (seconds: number, locale: Locale) =>
  m.format_seconds({ value: numberFormat(locale).format(seconds) }, { locale });

// A whole number of minutes with its unit, in the Locale: « 5 min ».
export const minutesLabel = (minutes: number, locale: Locale) =>
  m.format_minutes({ value: numberFormat(locale).format(minutes) }, { locale });
