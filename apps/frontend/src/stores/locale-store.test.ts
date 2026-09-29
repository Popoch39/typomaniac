import { beforeEach, describe, expect, test } from "vitest";

import { getLocale } from "@/paraglide/runtime";
import { readLocaleFrom, useLocaleStore } from "@/stores/locale-store";

const storageKey = "typomaniac-locale";

const keep = (chosen: string) =>
  localStorage.setItem(storageKey, JSON.stringify({ state: { chosen }, version: 1 }));

const chosen = () => useLocaleStore.getState().chosen;

// Blocked site data: any access to the storage throws.
const unavailable = (): Storage => {
  throw new DOMException("Blocked", "SecurityError");
};

beforeEach(() => {
  localStorage.clear();
  useLocaleStore.setState(useLocaleStore.getInitialState());
});

describe("the Locale store", () => {
  test("keeps the Locale chosen on this browser", () => {
    readLocaleFrom(() => localStorage);
    useLocaleStore.getState().choose("en");

    expect(JSON.parse(localStorage.getItem(storageKey) ?? "null")).toEqual({
      state: { chosen: "en" },
      version: 1,
    });
  });

  test("reads the Locale kept, and nothing else", () => {
    keep("fr");
    localStorage.setItem("other", "x");
    readLocaleFrom(() => localStorage);

    expect(chosen()).toBe("fr");
  });

  test("ignores a Locale it does not know, and leaves it stored", () => {
    keep("de");
    readLocaleFrom(() => localStorage);

    expect(chosen()).toBeNull();
    expect(localStorage.getItem(storageKey)).toContain('"de"');
  });

  test("ignores an entry it cannot read", () => {
    localStorage.setItem(storageKey, "{not json");
    readLocaleFrom(() => localStorage);

    expect(chosen()).toBeNull();
  });

  test("works for the visit when the storage is blocked", () => {
    readLocaleFrom(unavailable);
    useLocaleStore.getState().choose("en");

    expect(chosen()).toBe("en");
  });

  test("showing a Locale never changes the one chosen", () => {
    readLocaleFrom(() => localStorage);
    useLocaleStore.getState().choose("en");
    useLocaleStore.getState().show("fr");

    expect(useLocaleStore.getState().locale).toBe("fr");
    expect(chosen()).toBe("en");
  });

  test("the messages read the Locale shown", () => {
    useLocaleStore.getState().show("en");
    expect(getLocale()).toBe("en");

    useLocaleStore.getState().show("fr");
    expect(getLocale()).toBe("fr");
  });
});
