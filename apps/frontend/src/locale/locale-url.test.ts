import { describe, expect, test } from "vitest";

import { localeOfPath, withLocale, withoutLocale } from "@/locale/locale-url";

describe("localeOfPath", () => {
  test("reads the Locale leading the path", () => {
    expect(localeOfPath("/fr")).toBe("fr");
    expect(localeOfPath("/en/")).toBe("en");
    expect(localeOfPath("/fr/u/ada")).toBe("fr");
  });

  test("finds none in a path without a prefix, or with a segment merely starting like one", () => {
    expect(localeOfPath("/")).toBeNull();
    expect(localeOfPath("/leaderboard")).toBeNull();
    expect(localeOfPath("/friends")).toBeNull();
    expect(localeOfPath("/de/u/ada")).toBeNull();
  });
});

describe("withoutLocale", () => {
  test("drops the prefix, keeping the rest of the path", () => {
    expect(withoutLocale("/fr")).toBe("/");
    expect(withoutLocale("/en/")).toBe("/");
    expect(withoutLocale("/fr/u/ada")).toBe("/u/ada");
  });

  test("leaves a path without a prefix as it is", () => {
    expect(withoutLocale("/leaderboard")).toBe("/leaderboard");
    expect(withoutLocale("/")).toBe("/");
  });
});

describe("withLocale", () => {
  test("puts the Locale in front of a path", () => {
    expect(withLocale("/", "fr")).toBe("/fr");
    expect(withLocale("/leaderboard", "en")).toBe("/en/leaderboard");
  });

  test("replaces the Locale already there", () => {
    expect(withLocale("/fr/u/ada", "en")).toBe("/en/u/ada");
    expect(withLocale("/en", "fr")).toBe("/fr");
  });

  test("keeps the search and the hash", () => {
    expect(withLocale("/fr/duels?duel=d1#chart", "en")).toBe("/en/duels?duel=d1#chart");
    expect(withLocale("/?error=unable_to_link_account", "fr")).toBe(
      "/fr?error=unable_to_link_account",
    );
  });
});
