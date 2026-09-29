import type { Locale } from "@/locale/locales";

// The Locale of the browser's languages (`navigator.languages`, most preferred first): French if a
// French one comes before any English one, English otherwise, even when it speaks neither.
export const browserLocale = (languages: readonly string[]): Locale => {
  const spoken = languages.find((language) => /^(fr|en)(-|$)/i.test(language));

  return spoken?.toLowerCase().startsWith("fr") ? "fr" : "en";
};
