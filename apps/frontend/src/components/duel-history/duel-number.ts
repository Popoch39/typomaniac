import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";

const WHOLE = { maximumFractionDigits: 0 } as const;

// A figure of a finished Duel, rounded and grouped by thousands in the Locale (« 1 284 », "1,284");
// « — » for one that is not there: a Duel before the Score, a deleted opponent.
export const duelNumber = (value: number | null, locale: Locale) =>
  value === null ? "—" : numberFormat(locale, WHOLE).format(Math.round(value));
