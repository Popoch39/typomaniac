import type { Language } from "typing-engine";

import { duelKind } from "@/components/duel-history/duel-kind";
import { secondsLabel } from "@/lib/durations";
import { languageName } from "@/lib/language-names";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// The format of every Duel of the Queue, set by the server: until one is paired, the Queue and
// the Match proposal announce this one.
export const DUEL_SECONDS = 30;

export const DUEL_LANGUAGE: Language = "en";

// A Duel's format: whether it is a Challenge (never ranked), its time and its Language.
export type DuelFormat = { challenge: boolean; seconds: number; language: Language };

// A Duel's format in a line, in the Locale: « Duel classé · 30 s · anglais », « Challenge · 30 s ·
// English ».
export const duelFormatLine = ({ challenge, seconds, language }: DuelFormat, locale: Locale) =>
  m.duel_format_line(
    {
      kind: duelKind(!challenge, locale),
      duration: secondsLabel(seconds, locale),
      language: languageName(language, locale),
    },
    { locale },
  );

// The format of a Duel of the Queue, Ranked, before it is paired.
export const queueDuelFormatLine = (locale: Locale) =>
  duelFormatLine({ challenge: false, seconds: DUEL_SECONDS, language: DUEL_LANGUAGE }, locale);
