import { HANDLE_MAX_LENGTH, HANDLE_MIN_LENGTH } from "handle";

import type { HandleUnavailable } from "@/api/handle";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// A bound of the Handle rules, counted and written in the Locale.
const bound = (count: number, locale: Locale) => ({
  count,
  shown: numberFormat(locale).format(count),
});

// What the User reads when a Handle is refused: what to fix.
const REFUSALS: Record<HandleUnavailable, (locale: Locale) => string> = {
  "too-short": (locale) => m.handle_too_short(bound(HANDLE_MIN_LENGTH, locale), { locale }),
  "too-long": (locale) => m.handle_too_long(bound(HANDLE_MAX_LENGTH, locale), { locale }),
  "invalid-chars": (locale) => m.handle_invalid_chars({}, { locale }),
  reserved: (locale) => m.handle_reserved({}, { locale }),
  taken: (locale) => m.handle_taken({}, { locale }),
};

export const refusalMessage = (reason: HandleUnavailable, locale: Locale) =>
  REFUSALS[reason](locale);
