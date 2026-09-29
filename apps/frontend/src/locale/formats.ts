import type { Locale } from "@/locale/locales";

// The Intl locale behind each Locale: US English (ADR 0011), French from France. Never write an
// Intl locale anywhere else: take a formatter from here, for the Locale read by `useLocale`.
const INTL_LOCALES: Record<Locale, string> = { fr: "fr-FR", en: "en-US" };

// The formatters of an Intl constructor, each made once per Locale and options, then reused: Intl
// formatters are costly to build.
const memoized = <Options, Formatter>(
  Format: new (locale: string, options?: Options) => Formatter,
) => {
  const made = new Map<string, Formatter>();

  return (locale: Locale, options?: Options) => {
    const key = `${locale} ${JSON.stringify(options ?? {})}`;
    const known = made.get(key);

    if (typeof known !== "undefined") {
      return known;
    }

    const formatter = new Format(INTL_LOCALES[locale], options);

    made.set(key, formatter);

    return formatter;
  };
};

export const numberFormat = memoized(Intl.NumberFormat);

export const dateFormat = memoized(Intl.DateTimeFormat);

export const relativeTimeFormat = memoized(Intl.RelativeTimeFormat);

export const pluralRules = memoized(Intl.PluralRules);

// What follows a rank in each Locale, by its ordinal plural category.
const ORDINAL_SUFFIXES: Record<Locale, Partial<Record<Intl.LDMLPluralRule, string>>> = {
  en: { one: "st", two: "nd", few: "rd", other: "th" },
  fr: { one: "er", other: "e" },
};

const ORDINAL = { type: "ordinal" } as const;

// A rank in words: "1st", "23rd" in English; "1er", "23e" in French.
export const ordinal = (locale: Locale, rank: number) => {
  const suffixes = ORDINAL_SUFFIXES[locale];
  const suffix = suffixes[pluralRules(locale, ORDINAL).select(rank)] ?? suffixes.other ?? "";

  return `${numberFormat(locale).format(rank)}${suffix}`;
};
