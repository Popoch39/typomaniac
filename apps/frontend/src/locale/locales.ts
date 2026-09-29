import { baseLocale, isLocale, type Locale, locales } from "@/paraglide/runtime";

export { baseLocale, isLocale, type Locale, locales };

// Each Locale in its own language, the same in every Locale: whoever does not read the other one
// still recognises theirs.
export const LOCALE_NAMES: Record<Locale, string> = { fr: "Français", en: "English" };

// The Locale the switch proposes: the other one.
export const otherLocale = (locale: Locale): Locale => (locale === "fr" ? "en" : "fr");
