import { playsIntro } from "@/components/intro/plays-intro";
import { consumeOAuthReturn } from "@/lib/oauth-round-trip";

// Whether this page plays the Intro, read from the browser once, synchronously, before React's
// first render. It consumes the OAuth round trip's flag: call it once per page load.
export const introAtStartup = () =>
  playsIntro({
    pathname: window.location.pathname,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    // The breakpoint of « Passe sur ordinateur » (`lg`).
    wide: window.matchMedia("(min-width: 64rem)").matches,
    oauthReturn: consumeOAuthReturn(),
  });
