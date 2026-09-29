import type { Language } from "typing-engine";

import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

const LANGUAGE_NAMES: Record<Language, (locale: Locale) => string> = {
  fr: (locale) => m.language_name_fr({}, { locale }),
  en: (locale) => m.language_name_en({}, { locale }),
};

// A Language in words, in the Locale, as the settings of the Run and the Replay write it: « French »
// in English, « français » in French.
export const languageName = (language: Language, locale: Locale) =>
  LANGUAGE_NAMES[language](locale);
