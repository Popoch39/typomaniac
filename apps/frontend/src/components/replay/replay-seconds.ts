import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

const TENTHS = { maximumFractionDigits: 1 } as const;

// An instant of the Replay in seconds, to the tenth, in the Locale: « 3,1 s », "3.1 s".
export const replaySeconds = (ms: number, locale: Locale) =>
  m.format_seconds({ value: numberFormat(locale, TENTHS).format(ms / 1000) }, { locale });
