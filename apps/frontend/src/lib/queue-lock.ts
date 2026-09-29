import { minutesLabel } from "@/lib/durations";
import { formatElapsed } from "@/lib/queue-wait";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// The whole seconds left of a Queue lock ending at `until`, the last one counted until it is over:
// 0 once it is.
export const lockSecondsLeft = (until: number, now: number) =>
  Math.max(0, Math.ceil((until - now) / 1000));

// The time left of a Queue lock, as a clock shows it: "4:59".
export const lockTimeLeftLabel = (seconds: number) => formatElapsed(seconds * 1000);

// How long a Queue lock lasts, in minutes rounded up: « 5 min ».
export const lockDurationLabel = (duration: number, locale: Locale) =>
  minutesLabel(Math.max(1, Math.ceil(duration / 60_000)), locale);

// How long a Dodge locked the Queue: « Queue bloquée 5 min ».
export const queueLockLabel = (duration: number, locale: Locale) =>
  m.queue_lock({ duration: lockDurationLabel(duration, locale) }, { locale });
