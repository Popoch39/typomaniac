import { describe, expect, test } from "vitest";

import { playsIntro, type StartupConditions } from "@/components/intro/plays-intro";

// A first load of the home page, on a wide screen, nothing against the Intro.
const home: StartupConditions = {
  pathname: "/fr",
  reducedMotion: false,
  wide: true,
  duelInProgress: false,
  oauthReturn: false,
};

describe("whether the page plays the Intro as it starts", () => {
  test.each(["/", "/fr", "/fr/", "/en", "/en/"])("it plays on the home page %s", (pathname) => {
    expect(playsIntro({ ...home, pathname })).toBe(true);
  });

  test.each(["/fr/leaderboard", "/en/u/ada", "/leaderboard", "/duels/42", "/de", "/developer"])(
    "it plays on any other page too, even one no route answers: %s",
    (pathname) => {
      expect(playsIntro({ ...home, pathname })).toBe(true);
    },
  );

  test.each(["/dev", "/dev/intro", "/dev/aura", "/fr/dev/intro"])(
    "never on a dev page: %s",
    (pathname) => {
      expect(playsIntro({ ...home, pathname })).toBe(false);
    },
  );

  test("never for who prefers reduced motion", () => {
    expect(playsIntro({ ...home, reducedMotion: true })).toBe(false);
  });

  test("never on a screen under 1024 px, hidden under « Passe sur ordinateur »", () => {
    expect(playsIntro({ ...home, wide: false })).toBe(false);
  });

  test("never while this tab plays a Duel", () => {
    expect(playsIntro({ ...home, duelInProgress: true })).toBe(false);
  });

  test("never back from an OAuth sign-in", () => {
    expect(playsIntro({ ...home, oauthReturn: true })).toBe(false);
  });
});
