import { isLocale, type Locale } from "@/locale/locales";

// "/fr/u/ada" → "fr", then "/u/ada" as the path's rest ("" for "/fr" or "/fr/").
const PREFIXED = /^\/([^/?#]+)(?:\/|$)(.*)$/s;

// Every URL of the app starts with its Locale (ADR 0011): "/fr/leaderboard", "/en/leaderboard".
// The Locale leading `pathname`, or null without one.
export const localeOfPath = (pathname: string): Locale | null => {
  const segment = pathname.match(PREFIXED)?.[1];

  return typeof segment === "undefined" || !isLocale(segment) ? null : segment;
};

// The path the route tree knows: `pathname` without its Locale.
export const withoutLocale = (pathname: string) => {
  if (localeOfPath(pathname) === null) {
    return pathname;
  }

  return `/${pathname.match(PREFIXED)?.[2] ?? ""}`;
};

// `href` (a path, with its search and hash) in `locale`: its Locale replaced, or put in front.
export const withLocale = (href: string, locale: Locale) => {
  const pathEnd = href.search(/[?#]/);
  const pathname = pathEnd === -1 ? href : href.slice(0, pathEnd);
  const rest = pathEnd === -1 ? "" : href.slice(pathEnd);
  const path = withoutLocale(pathname);

  return `/${locale}${path === "/" ? "" : path}${rest}`;
};
