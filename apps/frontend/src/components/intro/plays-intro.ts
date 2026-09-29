import { withoutLocale } from "@/locale/locale-url";

// What the page knows of itself as it starts, read once from the browser (`introAtStartup`).
export type StartupConditions = {
  pathname: string;
  // `prefers-reduced-motion: reduce`.
  reducedMotion: boolean;
  // At least 1024 px wide: below, « Passe sur ordinateur » hides the app (ADR 0009).
  wide: boolean;
  // This tab was playing a Duel (see duel-in-progress): the reload resumes it.
  duelInProgress: boolean;
  // Back from an OAuth sign-in (see oauth-round-trip): the Intro was seen just before.
  oauthReturn: boolean;
};

// The dev pages ("/dev", "/dev/intro"…): /dev/intro replays the Intro on demand.
const DEV_PAGE = /^\/dev(?:\/|$)/;

// The Intro plays as the page starts, on any page but a dev one, in any Locale, for who has not
// asked for less motion, on a screen wide enough for the app, outside a Duel and not back from an
// OAuth sign-in.
export const playsIntro = ({
  pathname,
  reducedMotion,
  wide,
  duelInProgress,
  oauthReturn,
}: StartupConditions) =>
  !DEV_PAGE.test(withoutLocale(pathname)) &&
  !reducedMotion &&
  wide &&
  !duelInProgress &&
  !oauthReturn;
