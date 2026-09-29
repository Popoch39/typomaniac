import { secondsLabel } from "@/lib/durations";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// A wait as a clock shows it: minutes and seconds, "0:07", never negative.
export const formatElapsed = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000));

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

// How many Users are in the Queue, the User included: never fewer than them.
export const queueSizeLabel = (size: number, locale: Locale) => {
  const count = Math.max(1, size);

  return m.queue_size({ count, shown: numberFormat(locale).format(count) }, { locale });
};

// The Estimated wait, rounded to the second above; nothing without one.
export const estimatedWaitLabel = (estimatedWait: number | null, locale: Locale) =>
  estimatedWait === null
    ? null
    : m.queue_estimated_wait(
        { duration: secondsLabel(Math.max(1, Math.ceil(estimatedWait / 1000)), locale) },
        { locale },
      );
