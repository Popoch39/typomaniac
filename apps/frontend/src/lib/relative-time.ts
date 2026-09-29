import { relativeTimeFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// From the largest unit down: the first one the gap reaches is the one said.
const UNITS = [
  { unit: "day", ms: 86_400_000 },
  { unit: "hour", ms: 3_600_000 },
  { unit: "minute", ms: 60_000 },
] as const;

const AUTO = { numeric: "auto" } as const;

// How long ago `at` was, seen from `now` (ms since the epoch), in the Locale: « à l'instant » /
// "just now" under a minute, « il y a 5 minutes » / "5 minutes ago", « hier » / "yesterday"…
export const relativeTime = (at: number, now: number, locale: Locale) => {
  const gap = Math.max(0, now - at);
  const match = UNITS.find(({ ms }) => gap >= ms);

  return match
    ? relativeTimeFormat(locale, AUTO).format(-Math.floor(gap / match.ms), match.unit)
    : m.activity_just_now({}, { locale });
};
